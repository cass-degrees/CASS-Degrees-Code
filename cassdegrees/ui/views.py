from django.http import HttpResponse
from django.shortcuts import render
from django.db.models import Q
from api.models import DegreeModel, SubplanModel, CourseModel
import requests
import csv
from io import TextIOWrapper


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
def index(request):

    # add button parameters to be rendered on the main menu
    # TODO: Update URLs once initial page views are created
    buttons = [
        {'url': "/create_program/", 'img': "../static/img/create_plan_img.png", 'label': "Create Program Template"},
        {'url': "/create_subplan/", 'img': "../static/img/create_subplan_img.png", 'label': "Create Subplan"},
        {'url': "", 'img': "../static/img/create_list_img.png", 'label': "Create List"},
        {'url': "/list/", 'img': "../static/img/open_existing_img.png", 'label': "Open Existing"},
        {'url': "/list/?view=Course", 'img': "../static/img/manage_courses_img.png", 'label': "Manage Courses"}
    ]

    # Dynamically calculate expected width for buttons
    element_width = str(100 / len(buttons)) + "%"

    return render(request, 'index.html', context={'buttons': buttons, 'element_width': element_width})


def planList(request):
    """ Generates a table based on the JSON objects stored in 'data'

    NOTE: For the page to generate the tabs correctly, the api table data must be put in the context
    under the dictionary {'data': {'RELATION': RELATION_DATA, ...}}. To link to the actual data correctly,
    ensure the RELATION text is the same as what is called in the API (e.g. /api/model/RELATION/?format=json)

    :param request:
    :return <class django.http.response.HttpResponse>:
    """
    query = request.GET.get('q', '')

    # No search, render default page
    if not query:
        degree = requests.get(request.build_absolute_uri('/api/model/degree/?format=json')).json()
        subplan = requests.get(request.build_absolute_uri('/api/model/subplan/?format=json')).json()
        course = requests.get(request.build_absolute_uri('/api/model/course/?format=json')).json()

        return render(request, 'list.html', context={'data': {'Degree': degree, 'Subplan': subplan, 'Course': course}})
    # User search, render results
    else:
        # Remove common words and make the query set unique and uppercase
        stopwords = ['and', 'or', 'for', 'in', 'the', 'of', 'on', 'to']
        processed_query = [x.upper() for x in query.replace(',', '').split(' ') if x not in stopwords]

        # Create blank queries for text and dates (Allows AND relationship between dates and text)
        # The AND/OR representations are there to give higher priority to results that contain all keywords
        new_query = {x: {'AND': Q(), 'OR': Q(), 'date': Q()} for x in ['Course', 'Subplan', 'Degree']}

        # Function that takes an input dict and a sub-query, and appends the sub-query based on the appropriate logic
        def build_query(target, q):
            target['AND'] &= q
            target['OR']  |= q

        # Generate queries based on the processed query string
        for term in processed_query:
            # If the current term is of the form TEXT1234, perform a case insensitive search on course codes
            if len(term) == 8 and term[:4].isalpha() and term[4:].isnumeric():
                build_query(new_query['Course'], Q(code__iexact=term))
            # If the term ends with '-MAJ', '-MIN', or '-SPEC', search for subplans containing the inputted term
            elif term[-4:] == '-MAJ' or term[-4:] == '-MIN' or term[-5:] == '-SPEC':
                build_query(new_query['Subplan'], Q(code__icontains=term))
            # If the term is a year-like number, remove results outside that year unless the year in the course code or name
            elif len(term) == 4 and term.isnumeric():
                # NOTE: The name and code search is done because Program names can have numbers and course names can have dates
                # BUG: This implementation will not return a course with a year in the name unless it matches all other keywords
                #      e.g. CHIN2019 will not show up in a search for `COMP 2019`, but it will appear in a search for `COMP CHIN`
                new_query['Course' ]['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
                new_query['Subplan']['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
                new_query['Degree' ]['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
            # If the search term has no obvious structure, search for it in the code and name fields
            else:
                build_query(new_query['Course' ], Q(code__icontains=term) | Q(name__icontains=term))
                build_query(new_query['Subplan'], Q(code__icontains=term) | Q(name__icontains=term))
                build_query(new_query['Degree' ], Q(code__icontains=term) | Q(name__icontains=term))

        # If the degree, subplan, or course searches are non-empty, query the database
        data = {}
        for target, model in [('Degree', DegreeModel), ('Subplan', SubplanModel), ('Course', CourseModel)]:
            # If the query is not blank, search for it in the database (Prevents unnecessary searches)
            if new_query[target]['AND'].children or new_query[target]['date'].children:
                # SELECT from the the appropriate relation with the AND and OR queries
                data[target] = list(model.objects.filter(new_query[target]['AND'], new_query[target]['date']).values())
                or_query     = list(model.objects.filter(new_query[target]['OR'], new_query[target]['date']).values())
                # Create an exclusions list of all the results found by the AND query
                exclusions   = [elm['id'] for elm in data[target]]
                # Add to the OR results to the end of the AND list, assuming they aren't already in there
                # The result of this will be the list [High_Priority_Queries]+[Low_Priority_Queries]
                data[target] += [x for x in or_query if x['id'] not in exclusions]

        # Remove relations that returned no data so the tabs do not appear in the list page
        data = {k: v for k, v in data.items() if v}

        # Render the requested data and autofill the query in the search
        return render(request, 'list.html', context={'autofill': query, 'data': data})


# I went through this tutorial to create the form html file and this view:
# https://docs.djangoproject.com/en/2.2/topics/forms/
# Hope this serves as an inspiration for when we make proper views and functions to submit course information
def sampleform(request):
    # If POST request, redirect the received information to the backend:
    if request.method == 'POST':
        # Hard coding url is a bad practice; this is only a temporary measure for this demo sampleform.
        model_api_url = 'http://127.0.0.1:8000/api/model/sample/'
        post_data = request.POST
        actual_request = post_data.get('_method')

        # This method of transferring data to the API was inspired by:
        # https://stackoverflow.com/questions/11663945/calling-a-rest-api-from-django-view
        if actual_request == "post":
            # Create a python dictionary with exactly the same fields as the model (in this case, sampleModel)
            samplefields = \
                {
                    'id': post_data.get('id'),
                    'text': post_data.get('text')
                }
            # Submit a POST request to the sample API with samplefields as data (basically a new record)
            rest_api = requests.post(model_api_url, data=samplefields)

            if rest_api.status_code == 201:
                return HttpResponse('Record successfully added!')
            else:
                return HttpResponse('Failed to submit!')

        elif actual_request == "patch":
            id_to_edit = post_data.get('id')
            # Patch requests (editing an already existing resource only requires fields that are changed
            samplefields = \
                {
                    'text': post_data.get('text')
                }

            rest_api = requests.patch(model_api_url + id_to_edit + '/', data=samplefields)

            if rest_api.status_code == 200:
                return HttpResponse('Record successfully edited!')
            else:
                return HttpResponse('Failed to edit record!')

        else:
            id_to_delete = post_data.get('id')

            rest_api = requests.delete(model_api_url + id_to_delete + '/')

            if rest_api.status_code == 204:
                return HttpResponse('Record successfully deleted!')
            else:
                return HttpResponse('Failed to delete record!')

    else:
        return render(request, 'sampleform.html')


def create_program(request):
    # If POST request, redirect the received information to the backend:
    render_properties = {
        'msg': None,
        'is_error': False
    }

    if request.method == 'POST':
        post_data = request.POST

        degree_dict = \
            {
                'code': post_data.get('code'),
                'name': post_data.get('name'),
                # Do some early validation of these fields
                'year': int(post_data.get('year')),
                'units': int(post_data.get('units')),
                'degreeType': post_data.get('degreeType')
            }

        for k, v in degree_dict.items():
            render_properties[k] = v

        # Verify that there are no duplicate name/year pairs
        if DegreeModel.objects.filter(name__iexact=degree_dict['name'], year=degree_dict['year']).count() > 0:
            render_properties['is_error'] = True
            render_properties['msg'] = "A program with the same year and name already exists!"
        else:
            model_api_url = 'http://127.0.0.1:8000/api/model/degree/'
            rest_api = requests.post(model_api_url, data=degree_dict)

            if rest_api.ok:
                # TODO: Redirect to edit_program
                render_properties['msg'] = 'Program template successfully added!'
            else:
                render_properties['is_error'] = True

                # Attempt to parse the incoming error message
                rest_response = rest_api.json()
                if "The fields code, year must make a unique set." in rest_response['non_field_errors']:
                    render_properties['msg'] = "A program with the same year and code already exists!"
                else:
                    render_properties['msg'] = "Unknown error while submitting document."

    return render(request, 'createprogram.html', context=render_properties)


def create_subplan(request):
    return render(request, 'createsubplan.html')


# inspired by the samepleform function created by Daniel Jang
def manage_courses(request):
    # Reads the 'action' attribute from the url (i.e. manage/?action=Add) and determines the submission method
    actions = ['Add', 'Edit', 'Delete']
    action = request.GET.get('action', 'Add')

    courses = requests.get(request.build_absolute_uri('/api/model/course/?format=json')).json()
    courses = [{'code': course} for course in set([x['code'] for x in courses])]
    # If POST request, redirect the received information to the backend:
    render_properties = {
        'msg': None,
        'is_error': False
    }
    if request.method == 'POST':
        model_api_url = request.build_absolute_uri('/api/model/course/')
        post_data = request.POST
        # actual_request = post_data.get('_method')

        if action == 'Add':
            # Create a python dictionary with exactly the same fields as the model (in this case, CourseModel)
            offered_sems = post_data.getlist('semesters[]')
            course_instance = \
                {
                    'code': post_data.get('code'),
                    'year': post_data.get('year'),
                    'name': post_data.get('name'),
                    'units': post_data.get('units'),
                    'offeredSem1': 'semester1' in offered_sems,
                    'offeredSem2': 'semester2' in offered_sems
                }
            # Submit a POST request to the course API with course_instance as data
            rest_api = requests.post(model_api_url, data=course_instance)
            if rest_api.status_code == 201:
                render_properties['msg'] = 'Course successfully added!'
            else:
                render_properties['is_error'] = True
                # detects if the course already exists
                if 'The fields code, year must make a unique set.' in rest_api.json()['non_field_errors']:
                    render_properties['msg'] = "The course you are trying to create already exists!"
                else:
                    render_properties['msg'] = "Unknown error while submitting document. Please try again."

        # to be implemented, currently has the sample model code
        elif action == 'Edit':
            id_to_edit = post_data.get('id')
            # Patch requests (editing an already existing resource only requires fields that are changed
            course_instance = \
                {
                    'text': post_data.get('text')
                }

            rest_api = requests.patch(model_api_url + id_to_edit + '/', data=course_instance)

            if rest_api.status_code == 200:
                render_properties['msg'] = 'Course information successfully modified!'
            else:
                render_properties['is_error'] = True
                render_properties['msg'] = "Failed to edit course information (unknown error). Please try again."

        # to be implemented, currently has the sample model code
        elif action == 'Delete':
            id_to_delete = post_data.get('id')

            rest_api = requests.delete(model_api_url + id_to_delete + '/')

            if rest_api.status_code == 204:
                render_properties['msg'] = 'Course successfully deleted!'
            else:
                render_properties['is_error'] = True
                render_properties['msg'] = "Failed to delete course. An unknown error has occurred. Please try again."

    return render(request, 'managecourses.html', context={'action': action, 'courses': courses,
                                                          'render': render_properties, 'actions': actions})


# Submit file with courses or subplans with the following formats:
# Note that column order does not matter, as long as data corresponds to the order of the first row.

# Courses:
# code%year%name%units%offeredSem1%offeredSem2
# ARTS1001%2019%Introduction to Arts%6%True%False
# ...

# Subplans:
# code%year%name%units%planType
# ARTI-SPEC%2016%Artificial Intelligence%24%SPEC
# ...
def bulk_data_upload(request):
    context = {}
    context['upload_type'] = ['Courses', 'Subplans']
    content_type = request.GET.get('type')

    if content_type in context['upload_type']:
        context['current_tab'] = content_type

    if request.method == 'POST':
        base_model_url = request.build_absolute_uri('/api/model/')

        # Open file in text mode:
        # https://stackoverflow.com/questions/16243023/how-to-resolve-iterator-should-return-strings-not-bytes
        uploaded_file = TextIOWrapper(request.FILES['uploaded_file'], encoding=request.encoding)

        # Reading the '%' using the csv import module came from:
        # https://stackoverflow.com/questions/13992971/reading-and-parsing-a-tsv-file-then-manipulating-it-for-saving-as-csv-efficie

        # % is used instead of comma since the course name may include commas (which would break this function)
        uploaded_file = csv.reader(uploaded_file, delimiter='%')

        # First row contains the column type headings (code, name etc). We can't add them to the db.
        first_row_checked = False

        # Check if any errors or successes appear when uploading the files.
        # Used for determining type of message to show to the user on the progress of their file upload.
        any_error = False
        any_success = False

        # Stores the index of the column containing the data type of each row,
        # so that the right data is stored in the right column
        # This would also allow columns to be in any order, and courses/subplans would still be added.
        map = {}
        for row in uploaded_file:
            if first_row_checked:
                if content_type == 'Courses':
                    # If number of columns from file doesn't match the model, return error to user.
                    if len(row) != 6:
                        any_error = True
                        break

                    course_instance = \
                        {
                            'code': row[map['code']],
                            'year': int(row[map['year']]),
                            'name': row[map['name']],
                            'units': int(row[map['units']]),
                            'offeredSem1': bool(row[map['offeredSem1']]),
                            'offeredSem2': bool(row[map['offeredSem2']])
                        }
                    print(course_instance)

                    # Submit a POST request to the course API with course_instance as data
                    rest_api = requests.post(base_model_url + 'course/', data=course_instance)
                    if rest_api.status_code == 201:
                        any_success = True
                    else:
                        any_error = True

                elif content_type == 'Subplans':
                    if len(row) != 5:
                        any_error = True
                        break

                    subplan_instance = \
                        {
                            'code': row[map['code']],
                            'year': int(row[map['year']]),
                            'name': row[map['name']],
                            'units': int(row[map['units']]),
                            'planType': str(row[map['planType']])
                        }
                    rest_api = requests.post(base_model_url + 'subplan/', data=subplan_instance)
                    if rest_api.status_code == 201:
                        any_success = True
                    else:
                        any_error = True

            else:
                i = 0
                for col in row:
                    map[col] = i
                    i += 1
                first_row_checked = True

        # Display error messages depending on the level of success of bulk upload.
        # There are 3 categories: All successful, some successful or none successful.
        if any_success and not any_error:
            context['user_msg'] = "All items has been added successfully!"
            context['err_type'] = "success"

        elif any_success and any_error:
            context['user_msg'] = "Some items could not be added. Have you added them already? Please check the " \
                                  + content_type + \
                                  " list and try manually adding ones that failed through the dedicated forms."
            context['err_type'] = "warn"

        elif not any_success and any_error:
            context['user_msg'] = "All items failed to be added. " \
                                  "Either you have already uploaded the same contents, " \
                                  "or the format of the file is incorrect. Please try again."
            context['err_type'] = "error"

    return render(request, 'bulkupload.html', context=context)

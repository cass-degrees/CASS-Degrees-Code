from django.http import HttpResponse
from django.shortcuts import render
from django.db.models import Q
from api.models import DegreeModel, SubplanModel, CourseModel
import requests


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
def index(request):

    # add button parameters to be rendered on the main menu
    # TODO: Update URLs once initial page views are created
    buttons = [
        {'url': "/api/model/degree/", 'img': "../static/img/create_plan_img.png", 'label': "Create Plan"},
        {'url': "/create_subplan/", 'img': "../static/img/create_subplan_img.png", 'label': "Create Subplan"},
        {'url': "", 'img': "../static/img/create_list_img.png", 'label': "Create List"},
        {'url': "/list/", 'img': "../static/img/open_existing_img.png", 'label': "Open Existing"},
        {'url': "/list/?view=Course", 'img': "../static/img/manage_courses_img.png", 'label': "Manage Courses"}
    ]

    return render(request, 'index.html', context={'buttons': buttons})


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

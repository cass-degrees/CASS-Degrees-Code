from django.http import HttpResponse
from django.shortcuts import render
import os
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
    degree = requests.get(request.build_absolute_uri('/api/model/degree/?format=json')).json()
    subplan = requests.get(request.build_absolute_uri('/api/model/subplan/?format=json')).json()
    course = requests.get(request.build_absolute_uri('/api/model/course/?format=json')).json()

    return render(request, 'list.html', context={'data': {'Degree': degree, 'Subplan': subplan, 'Course': course}})


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

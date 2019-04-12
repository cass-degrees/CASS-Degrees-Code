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
    course  = requests.get(request.build_absolute_uri('/api/model/course/?format=json')).json()

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

from django.contrib.auth.decorators import login_required
from django.shortcuts import render


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
@login_required
def index(request):

    # add button parameters to be rendered on the main menu
    # TODO: Update URLs once initial page views are created
    buttons = [
        {'url': "/create/program/", 'img': "../static/img/create_plan_img.png", 'label': "Create Program Template"},
        {'url': "/create/subplan/", 'img': "../static/img/create_subplan_img.png", 'label': "Create Subplan"},
        {'url': "/create/course/", 'img': "../static/img/create_course_img.png", 'label': "Create Course"},
        {'url': "/list/", 'img': "../static/img/open_existing_img.png", 'label':
            "Manage Existing Programs, Subplans & Courses"}
    ]

    # Dynamically calculate expected width for buttons
    element_width = str(100 / len(buttons)) + "%"

    return render(request, 'index.html', context={'buttons': buttons, 'element_width': element_width})

from django.contrib.auth.decorators import login_required
from django.shortcuts import render


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
@login_required
def index(request):

    # add button parameters to be rendered on the main menu
    buttons = [
        {'url': "/create/program/", 'kind': "fas fa-file-medical", 'label': "Create Program Template"},
        {'url': "/create/subplan/", 'kind': "fas fa-clipboard-list", 'label': "Create Subplan"},
        {'url': "/create/course/", 'kind': "fas fa-th", 'label': "Create Course"},
        {'url': "/list/", 'kind': "fas fa-edit", 'label': "Manage Existing Programs, Subplans & Courses"},
        {'url': "/bulk_upload/", 'kind': "fas fa-sign-in-alt", 'label': "Bulk Upload"}
    ]

    # Dynamically calculate expected width for buttons
    element_width = str(100 / len(buttons)) + "%"

    return render(request, 'index.html', context={'buttons': buttons, 'element_width': element_width})

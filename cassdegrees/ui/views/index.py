from django.shortcuts import render


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
def index(request):

    # add button parameters to be rendered on the main menu
    # TODO: Update URLs once initial page views are created
    buttons = [
        {'url': "/create/program/", 'img': "../static/img/create_plan_img.png", 'label': "Create Program Template"},
        {'url': "/create/subplan/", 'img': "../static/img/create_subplan_img.png", 'label': "Create Subplan"},
        {'url': "", 'img': "../static/img/create_list_img.png", 'label': "Create List"},
        {'url': "/list/", 'img': "../static/img/open_existing_img.png", 'label': "Open Existing"},
        {'url': "/list/?view=Course", 'img': "../static/img/manage_courses_img.png", 'label': "Manage Courses"}
    ]

    # Dynamically calculate expected width for buttons
    element_width = str(100 / len(buttons)) + "%"

    return render(request, 'index.html', context={'buttons': buttons, 'element_width': element_width})

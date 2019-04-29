from django.shortcuts import render
import requests

from ui.forms import EditProgramFormSnippet


def create_program(request):
    submitted = False

    if request.method == 'POST':
        form = EditProgramFormSnippet(request.POST)

        if form.is_valid():
            form.save()
            submitted = True

    else:
        form = EditProgramFormSnippet()

    return render(request, 'createprogram.html', context={
        "form": form,
        "submitted": submitted
    })


def manage_programs(request):
    # Reads the 'action' attribute from the url (i.e. manage/?action=Add) and determines the submission method
    action = request.GET.get('action', 'Add')

    program = requests.get(request.build_absolute_uri('/api/model/degree/?format=json')).json()
    # If POST request, redirect the received information to the backend:
    render_properties = {
        'msg': None,
        'is_error': False
    }

    if request.method == 'POST':
        model_api_url = request.build_absolute_uri('/api/model/degree/')
        post_data = request.POST
        perform_function = post_data.get('perform_function')

        # If the request came from list.html (from the add, edit and delete button from the courses list page)
        # Edit is pending the relevant story issue.
        if perform_function == 'retrieve view from selected':
            if action == 'Edit':
                # TODO: edit programs
                render_properties['msg'] = 'Not yet Implemented!'

            elif action == 'Delete':
                ids_to_delete = post_data.getlist('id')
                rest_api = None
                for id_to_delete in ids_to_delete:
                    rest_api = requests.delete(model_api_url + id_to_delete + '/')

                if rest_api is None:
                    render_properties['is_error'] = True
                    render_properties['msg'] = 'Please select a program to delete!'
                else:
                    if rest_api.status_code == 204:
                        render_properties['msg'] = 'program successfully deleted!'
                    else:
                        render_properties['is_error'] = True
                        render_properties['msg'] = "Failed to delete program. " \
                                                   "An unknown error has occurred. Please try again."

    return render(request, 'manageprograms.html', context={'action': action, 'program': program,
                                                           'render': render_properties})

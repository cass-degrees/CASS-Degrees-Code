from django.http import HttpResponseNotFound, HttpRequest
from django.shortcuts import render, redirect

from ui.forms import EditSubplanFormSnippet

from api.models import SubplanModel
from api.views import search
import json


# Using sampleform template and #59 - basic program creation workflow as it's inspirations
def create_subplan(request):
    duplicate = request.GET.get('duplicate', 'false')
    if duplicate == 'true':
        duplicate = True
    elif duplicate == 'false':
        duplicate = False

    # Initialise instance with an empty string so that we don't get a "may be referenced before assignment" error below
    instance = ""

    # If we are creating a subplan from a duplicate, we retrieve the instance with the given id
    # (should always come along with 'duplicate' variable) and return that data to the user.
    if duplicate:
        id = request.GET.get('id')
        if not id:
            return HttpResponseNotFound("Specified ID not found")
        # Find the subplan to specifically create from:
        instance = SubplanModel.objects.get(id=int(id))

    if request.method == 'POST':
        form = EditSubplanFormSnippet(request.POST)

        if form.is_valid():
            form.save()

            # If there is cached 'program' data, redirect to that page instead
            if request.session.get('cached_program_form_data', ''):
                return redirect(request.session.get('cached_program_form_source', '/'))
            else:
                return redirect('/list/?view=Subplan&msg=Successfully Added Subplan!')

    else:
        if duplicate:
            form = EditSubplanFormSnippet(instance=instance)
        else:
            form = EditSubplanFormSnippet()

    return render(request, 'createsubplan.html', context={
        "form": form
    })


def delete_subplan(request):
    data = request.POST
    instances = []

    # This is used to get the ids of subplans which are used by programs.
    # Generates an internal request to the search api made by Jack
    gen_request = HttpRequest()
    gen_request.GET = {'select': 'code,rules,year', 'from': 'program'}
    # Sends the request to the search api
    send_search_request = search(gen_request)
    subplans_in_programs = json.loads(send_search_request.content.decode())

    # Generate another request to get the subplan codes and ids
    # This is so we can get the code of the subplan from the id we are given
    gen_request.GET = {'select': 'code,id,year', 'from': 'subplan'}
    send_search_request = search(gen_request)
    subplan_ids = json.loads(send_search_request.content.decode())

    # Get the ids to delete and check if they're used by any programs
    ids_to_delete = data.getlist('id')
    safe_to_delete = True
    error_msg = ""
    for id_to_delete in ids_to_delete:
        # find if the id matches any rules in the programs.
        for program in subplans_in_programs:
            for subplans in program['rules']:
                # if we find a subplan in a program then its not safe to delete
                if int(id_to_delete) in subplans['ids']:
                    safe_to_delete = False
                    # Find the subplan code for the id to delete
                    for subplan in subplan_ids:
                        if int(id_to_delete) == subplan['id']:
                            # Populate the error message with the id's code names we found
                            error_msg += "Subplan code: '" + subplan['code'] + "' of year: " + str(subplan['year']) + \
                                        " is used by Program code: '" + program['code'] + "' of year: " + \
                                         str(subplan['year']) + ".\n"

        # Only delete if its safe to delete, otherwise notify the user of the dependencies
        if safe_to_delete:
            instances.append(SubplanModel.objects.get(id=int(id_to_delete)))

    if error_msg != "":
        return redirect('/list/?view=Subplan&error=Failed to Delete Subplan(s)!\n\n' + error_msg +
                        '\nPlease check dependencies!')

    if "confirm" in data:
        for instance in instances:
            instance.delete()

        return redirect('/list/?view=Subplan&msg=Successfully Deleted Subplan(s)!')
    else:
        return render(request, 'deletesubplans.html', context={
            "instances": instances
        })


def edit_subplan(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the program to specifically edit
    instance = SubplanModel.objects.get(id=int(id))

    if request.method == 'POST':
        form = EditSubplanFormSnippet(request.POST, instance=instance)

        if form.is_valid():
            form.save()
            return redirect('/list/?view=Subplan&msg=Successfully Edited Subplan!')

    else:
        form = EditSubplanFormSnippet(instance=instance)

    return render(request, 'createsubplan.html', context={
        "edit": True,
        "form": form
    })

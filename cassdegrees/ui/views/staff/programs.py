from django.contrib.auth.decorators import login_required

from api.models import ProgramModel
from django.http import HttpResponseNotFound, HttpRequest, HttpResponseRedirect
from django.shortcuts import render, redirect, reverse

from ui.forms import EditProgramFormSnippet
from ui.views.staff.courses import handle_course_subform
from django.utils import timezone

staff_url_prefix = "/staff/"

list_program_url = staff_url_prefix + "list/?view=Program"


@login_required
def create_program(request):
    duplicate = request.GET.get('duplicate', 'false')
    if duplicate == 'true':
        duplicate = True
    elif duplicate == 'false':
        duplicate = False

    # Initialise instance with an empty string so that we don't get a "may be referenced before assignment" error below
    instance = ""

    # If we are creating a program from a duplicate, we retrieve the instance with the given id
    # (should always come along with 'duplicate' variable) and return that data to the user.
    if duplicate:
        id = request.GET.get('id')
        if not id:
            return HttpResponseNotFound("Specified ID not found")
        # Find the program to specifically create from:
        instance = ProgramModel.objects.get(id=int(id))

    if request.method == 'POST':
        # If the user clicked the 'Create New Subplan' button, cache the form and start creating a new subplan
        if request.POST['action'] == 'New Subplan':
            request.session['cached_program_form_data'] = request.POST
            request.session['cached_program_form_source'] = request.path
            return redirect(staff_url_prefix + 'create/subplan/?program_year=' + request.POST['year'])

        form = EditProgramFormSnippet(request.POST)

        if request.POST.get("newCourse"):
            course_creation_form = handle_course_subform(request.POST['newCourse'])
        elif form.is_valid():
            form.save()
            return redirect(list_program_url + '&msg=Successfully Added a New Program: {}!'
                            .format(form['name'].value()))
        else:
            course_creation_form = handle_course_subform()

    else:
        course_creation_form = handle_course_subform()
        if duplicate:
            form = EditProgramFormSnippet(instance=instance)
        else:
            # If the cached path matches the current path, load the cached form and then clear the cache
            if request.session.get('cached_program_form_source', '') == request.path:
                form = EditProgramFormSnippet(request.session.get('cached_program_form_data', ''))

                try:
                    del request.session['cached_program_form_data']
                    del request.session['cached_program_form_source']
                except KeyError:
                    pass
            else:
                form = EditProgramFormSnippet()

    return render(request, 'staff/creation/createprogram.html', context={
        "edit": False,
        "form": form,
        "render_separately": ["staffNotes", "studentNotes"],
        "course_creation": course_creation_form
    })


@login_required
def delete_program(request):
    data = request.POST
    instances = []

    ids_to_delete = data.getlist('id')
    if not ids_to_delete:
        return redirect(list_program_url + '&error=Please select a Program to delete!')
    for id_to_delete in ids_to_delete:
        instances.append(ProgramModel.objects.get(id=int(id_to_delete)))

    if "confirm" in data:
        for instance in instances:
            instance.delete()

        return redirect(list_program_url + '&msg=Successfully Deleted Program(s)!')
    else:
        return render(request, 'staff/delete/deleteprograms.html', context={
            "instances": instances
        })


@login_required
def edit_program(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the program to specifically edit
    instance = ProgramModel.objects.get(id=int(id))

    # Set message to user if needed. Setting it to 'None' will not display the message box.
    message = None

    if request.method == 'POST':
        # If the user clicked the 'Create New Subplan' button, cache the form and start creating a new subplan
        if request.POST['action'] == 'New Subplan':
            request.session['cached_program_form_data'] = request.POST
            request.session['cached_program_form_source'] = request.build_absolute_uri()
            return redirect(staff_url_prefix + 'create/subplan/?program_year=' + request.POST['year'])

        form = EditProgramFormSnippet(request.POST, instance=instance)

        if request.POST.get("newCourse"):
            course_creation_form = handle_course_subform(request.POST['newCourse'])
        elif form.is_valid():
            instance.lastUpdated = timezone.now().strftime('%Y-%m-%d')
            instance.save(update_fields=['lastUpdated'])
            form.save()
            # POST Requests only carry boolean values over as string
            # Only redirect the user to the list page if the user presses "Save and Exit".
            # Otherwise, simply display a success message on the same page.
            if request.POST.get('redirect') == 'true':
                return redirect(list_program_url + '&msg=Successfully Edited the Program: {}!'
                                .format(form['name'].value()))
            else:
                course_creation_form = handle_course_subform()
                message = 'Successfully Edited the Program: {}!'.format(form['name'].value())
        else:
            course_creation_form = handle_course_subform()

    else:
        course_creation_form = handle_course_subform()
        # If the cached path matches the current path, load the cached form and then clear the cache
        if request.session.get('cached_program_form_source', '') == request.build_absolute_uri():
            form = EditProgramFormSnippet(request.session.get('cached_program_form_data', ''), instance=instance)

            try:
                del request.session['cached_program_form_data']
                del request.session['cached_program_form_source']
            except KeyError:
                pass
        else:
            form = EditProgramFormSnippet(instance=instance)

    return render(request, 'staff/creation/createprogram.html', context={
        'render': {'msg': message},
        "edit": True,
        "form": form,
        "render_separately": ["staffNotes", "studentNotes"],
        "course_creation": course_creation_form
    })

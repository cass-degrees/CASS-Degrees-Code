from django.contrib.auth.decorators import login_required

from api.models import CourseModel, SubplanModel, ProgramModel, ListModel
from api.views import search

from django.http import HttpResponseNotFound, HttpRequest
from django.shortcuts import render, redirect
from django.utils import timezone
from ui.views.staff.courses import handle_course_subform

from ui.forms import EditListFormSnippet

admin_url_prefix = "/staff/"
list_course_group_url = admin_url_prefix + "list/?view=List"



@login_required
def create_list(request):
    duplicate = request.GET.get('duplicate', 'false')
    if duplicate == 'true':
        duplicate = True
    elif duplicate == 'false':
        duplicate = False

    # Initialise instance with an empty string so that we don't get a "may be referenced before assignment" error below
    instance = ""

    # If we are creating a list from a duplicate, we retrieve the instance with the given id
    # (should always come along with 'duplicate' variable) and return that data to the user.
    if duplicate:
        id = request.GET.get('id')
        if not id:
            return HttpResponseNotFound("Specified ID not found")
        # Find the list to specifically create from:
        instance = ListModel.objects.get(id=int(id))

    if request.method == 'POST':
        form = EditListFormSnippet(request.POST)

        if request.POST.get("newCourse"):
            course_creation_form = handle_course_subform(request.POST['newCourse'])
        # todo: implement list view on admin view page then change url
        elif form.is_valid():
            form.save()
            return redirect(list_course_group_url + '&msg=Successfully Added List!')

    else:
        if duplicate:
            form = EditListFormSnippet(instance=instance)
            course_creation_form = handle_course_subform()
        else:
            form = EditListFormSnippet()
            course_creation_form = handle_course_subform()

    return render(request, 'staff/creation/createlist.html', context={
        "edit": False,
        "form": form,
        "course_creation": course_creation_form,
    })


# Delete list(s) selected through the admin list page. Lists are mutable collections used to bulk add courses to plans.
# As such, deleting or editing a list through the admin page will have no effect on existing plans containing that list
@login_required
def delete_list(request):
    data = request.POST
    instances = []

    ids_to_delete = data.getlist('id')
    if not ids_to_delete:
        return redirect(list_course_group_url + '&error=Please select a List to delete!')
    for id_to_delete in ids_to_delete:
        instances.append(ListModel.objects.get(id=int(id_to_delete)))

    if "confirm" in data:
        for instance in instances:
            instance.delete()

        return redirect(list_course_group_url + '&msg=Successfully Deleted List(s)!')
    else:
        return render(request, 'staff/delete/deletelists.html', context={
            "instances": instances
        })



@login_required
def edit_list(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the list to specifically edit
    instance = ListModel.objects.get(id=int(id))

    # Set message to user if needed. Setting it to 'None' will not display the message box.
    message = None

    # Initiatlise form
    course_creation_form = handle_course_subform()

    if request.method == 'POST':
        form = EditListFormSnippet(request.POST, instance=instance)

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
                return redirect(list_course_group_url + '&msg=Successfully Edited List!')
            else:
                message = "Successfully Edited List!"

    else:
        # todo: what is happening here?
        # If the cached path matches the current path, load the cached form and then clear the cache
        if request.session.get('cached_program_form_source', '') == request.build_absolute_uri():
            form = EditListFormSnippet(request.session.get('cached_program_form_data', ''), instance=instance)
            course_creation_form = handle_course_subform()

            try:
                del request.session['cached_program_form_data']
                del request.session['cached_program_form_source']
            except KeyError:
                pass
        else:
            form = EditListFormSnippet(instance=instance)
            course_creation_form = handle_course_subform()

    return render(request, 'staff/creation/createlist.html', context={
        'render': {'msg': message},
        "edit": True,
        "form": form,
        "course_creation": course_creation_form,
    })

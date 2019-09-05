from django.contrib.auth.decorators import login_required

from api.models import CourseModel, SubplanModel, ProgramModel, ListModel
from api.views import search

from django.http import HttpResponseNotFound, HttpRequest
from django.shortcuts import render, redirect
from django.utils import timezone

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

        # todo: implement list view on admin view page then change url
        if form.is_valid():
            form.save()
            return redirect(list_course_group_url + '&msg=Successfully Added List!')

    else:
        if duplicate:
            form = EditListFormSnippet(instance=instance)
        else:
            form = EditListFormSnippet()

    return render(request, 'staff/creation/createlist.html', context={
        "edit": False,
        "form": form,
    })


# Todo: implement list deletion with associated business rules (if any)


@login_required
def edit_list(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the list to specifically edit
    instance = ListModel.objects.get(id=int(id))

    # Set message to user if needed. Setting it to 'None' will not display the message box.
    message = None

    if request.method == 'POST':
        form = EditListFormSnippet(request.POST, instance=instance)

        if form.is_valid():
            instance.lastUpdated = timezone.now().strftime('%Y-%m-%d')
            instance.save(update_fields=['lastUpdated'])
            form.save()
            # POST Requests only carry boolean values over as string
            # Only redirect the user to the list page if the user presses "Save and Exit".
            # Otherwise, simply display a success message on the same page.
            # todo: implement list view for admin page then change url
            if request.POST.get('redirect') == 'true':
                return redirect(list_course_group_url + '&msg=Successfully Edited List!')
            else:
                message = "Successfully Edited List!"

    else:
        # todo: what is happening here?
        # If the cached path matches the current path, load the cached form and then clear the cache
        if request.session.get('cached_program_form_source', '') == request.build_absolute_uri():
            form = EditListFormSnippet(request.session.get('cached_program_form_data', ''), instance=instance)

            try:
                del request.session['cached_program_form_data']
                del request.session['cached_program_form_source']
            except KeyError:
                pass
        else:
            form = EditListFormSnippet(instance=instance)

    return render(request, 'staff/creation/createlist.html', context={
        'render': {'msg': message},
        "edit": True,
        "form": form,
    })

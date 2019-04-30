from django.http import HttpResponseNotFound
from django.shortcuts import render, redirect

from ui.forms import EditSubplanFormSnippet

from api.models import SubplanModel


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

    ids_to_delete = data.getlist('id')
    for id_to_delete in ids_to_delete:
        instances.append(SubplanModel.objects.get(id=int(id_to_delete)))

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

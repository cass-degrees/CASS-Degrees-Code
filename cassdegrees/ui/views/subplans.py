from django.http import HttpResponseNotFound
from django.shortcuts import render, redirect

from ui.forms import EditSubplanFormSnippet

from api.models import SubplanModel


# Using sampleform template and #59 - basic program creation workflow as it's inspirations
def create_subplan(request):
    if request.method == 'POST':
        form = EditSubplanFormSnippet(request.POST)

        if form.is_valid():
            form.save()
            return redirect('/list/?view=Subplan&msg=Successfully Added Subplan!')

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

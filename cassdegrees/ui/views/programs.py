from api.models import DegreeModel
from django.http import HttpResponseNotFound
from django.shortcuts import render, redirect

from ui.forms import EditProgramFormSnippet


def create_program(request):
    if request.method == 'POST':
        form = EditProgramFormSnippet(request.POST)

        if form.is_valid():
            form.save()
            return redirect('/list/?view=Degree&msg=Successfully Added Program!')

    else:
        form = EditProgramFormSnippet()

    return render(request, 'createprogram.html', context={
        "edit": False,
        "form": form
    })


def delete_program(request):
    data = request.POST
    instances = []

    ids_to_delete = data.getlist('id')
    for id_to_delete in ids_to_delete:
        instances.append(DegreeModel.objects.get(id=int(id_to_delete)))

    if "confirm" in data:
        for instance in instances:
            instance.delete()

        return redirect('/list/?view=Degree&msg=Successfully Deleted Program(s)!')
    else:
        return render(request, 'deleteprograms.html', context={
            "instances": instances
        })


def edit_program(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the program to specifically edit
    instance = DegreeModel.objects.get(id=int(id))

    if request.method == 'POST':
        form = EditProgramFormSnippet(request.POST, instance=instance)

        if form.is_valid():
            form.save()
            return redirect('/list/?view=Degree&msg=Successfully Edited Program!')

    else:
        form = EditProgramFormSnippet(instance=instance)

    return render(request, 'createprogram.html', context={
        "edit": True,
        "form": form
    })

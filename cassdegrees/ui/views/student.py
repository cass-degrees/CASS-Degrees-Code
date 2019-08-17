from api.models import ProgramModel
from django.forms import model_to_dict
from django.http import HttpResponseNotFound
from django.shortcuts import render


# Static page for student landing
def student_index(request):

    return render(request, 'student_index.html', context={})


# Creation page. Also sends program metadata.
def student_create(request):

    return render(request, 'student_create.html', context={'programs': ProgramModel.objects.filter(publish=True)})


# Main edit page. Sends program metadata for specific course chosen.
def student_edit(request):
    id_to_view = request.GET.get('id', None)

    if not id:
        return HttpResponseNotFound("Specified ID not found")

    instance = model_to_dict(ProgramModel.objects.get(id=int(id_to_view)))

    return render(request, 'student_edit.html', context={'program': instance,
                                                         'superuser': request.user.is_authenticated})

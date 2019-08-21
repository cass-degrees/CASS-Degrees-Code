from api.models import ProgramModel
from django.shortcuts import render

from django_weasyprint import WeasyTemplateResponse
from django.forms.models import model_to_dict

from ui.views.view_ import pretty_print_reqs, pretty_print_rules


def view_program_pdf(request):
    """ Renders a program to a PDF. """

    id_to_view = request.GET.get('id', None)

    # https://stackoverflow.com/questions/21925671/convert-django-model-object-to-dict-with-all-of-the-fields-intact
    instance = model_to_dict(ProgramModel.objects.get(id=int(id_to_view)))

    pretty_print_reqs(instance)
    pretty_print_rules(instance)

    context = {
        "program": instance
    }

    if "raw" in request.GET:
        return render(request, 'pdf_program.html', context=context)
    else:
        response = WeasyTemplateResponse(request=request, content_type='application/pdf',
                                         filename=instance["name"] + ".pdf", attachment=False,
                                         template="pdf_program.html", context=context)

        return response.render()

from django.shortcuts import render
from django.forms.models import model_to_dict

from api.models import CourseModel, ProgramModel, SubplanModel


def pretty_print_reqs(program):
    # It is convenient to generate the pretty list of each min/max rule
    # here in python before passing it to the template.
    for req in program["globalRequirements"]:
        if req["type"] == "min" or req["type"] == "max":
            pretty = ""
            for field in req.keys():
                if field[:7] == "courses":
                    if req[field]:
                        pretty += field[7:11] + "-level, "
            pretty = pretty[:-2]

            if len(pretty) > 18:
                pretty = pretty[:-12] + " and" + pretty[-11:]
            elif len(pretty) > 10:
                pretty = pretty[:-11] + " and" + pretty[-11:]

            req["prettyList"] = pretty


def pretty_print_rules(program):
    for rule in program["rules"]:
        # For a subplan rule, GET the name of the subplan for display
        if rule["type"] == "subplan":
            subplans = {}
            units = 0
            for id in rule["ids"]:
                object = SubplanModel.objects.get(id=int(id))
                units = object.units
                subplans[id] = object
            rule["contents"] = subplans
            rule["units"] = units


def view_(request):
    """
    Upon navigating to the view page for a given course, subplan, or program,
    this function will pull the requisite information about the item and return it
    for display by the site.

    :param request:
    :return: The views render to be passed to the web page
    """

    id_to_edit = request.GET.get('id', None)
    url = request.build_absolute_uri()

    if "course" in url:
        course = model_to_dict(CourseModel.objects.get(id=int(id_to_edit)))
        return render(request, 'viewcourse.html', context={'data': course})

    elif "subplan" in url:
        subplan = model_to_dict(SubplanModel.objects.get(id=int(id_to_edit)))
        return render(request, 'viewsubplan.html', context={'data': subplan})

    elif "program" in url:
        program = model_to_dict(ProgramModel.objects.get(id=int(id_to_edit)))

        pretty_print_reqs(program)
        pretty_print_rules(program)

        return render(request, 'viewprogram.html', context={'data': program})

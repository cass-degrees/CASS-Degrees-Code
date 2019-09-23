from django.shortcuts import render
from django.forms.models import model_to_dict
from django.http import HttpRequest

from api.models import CourseModel, ProgramModel, SubplanModel, ListModel
from api.views import search
import json


def pretty_print_reqs(program):
    # It is convenient to generate the pretty list of each min/max rule
    # here in python before passing it to the template.
    for req in program["globalRequirements"]:
        if req["type"] == "general":
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
    for original_rule in program["rules"]:
        # If the rule is an either_or rule, iterate over that, otherwise use the original rule
        for or_rule in original_rule["either_or"] if original_rule["type"] == "either_or" else [[original_rule]]:
            for rule in or_rule:
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
                if rule["type"] == "course":
                    gen_request = HttpRequest()
                    gen_request.GET = {'select': 'code,name,units', 'from': 'course'}
                    rule['courses'] = []
                    for code in rule['codes']:
                        # Add a new field containing the courses that match the given code
                        gen_request.GET['code_exact'] = code
                        courses = json.loads(search(gen_request).content.decode())
                        rule['courses'] += courses


def view_section(request):
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
        return render(request, 'staff/view/viewcourse.html', context={'data': course})

    elif "subplan" in url:
        # Create a request template to use for getting each course
        gen_request = HttpRequest()
        gen_request.GET = {'select': 'code,name,units', 'from': 'course'}

        subplan = model_to_dict(SubplanModel.objects.get(id=int(id_to_edit)))
        for rule in subplan['rules']:
            # Add a new field containing the courses that match the given code
            rule['courses'] = []
            for code in rule['codes']:
                gen_request.GET['code_exact'] = code
                courses = json.loads(search(gen_request).content.decode())
                rule['courses'] += courses

        return render(request, 'staff/view/viewsubplan.html', context={'data': subplan})

    elif "program" in url:
        program = model_to_dict(ProgramModel.objects.get(id=int(id_to_edit)))

        pretty_print_reqs(program)
        pretty_print_rules(program)

        return render(request, 'staff/view/viewprogram.html', context={'data': program})

    # ListModel(id, name, year, elements, lastupdated)
    elif "list" in url:
        # ListModel.elements already contains the code and name of each unit in the list
        cList = model_to_dict(ListModel.objects.get(id=int(id_to_edit)))

        return render(request, 'staff/view/viewlist.html', context={'data': cList})
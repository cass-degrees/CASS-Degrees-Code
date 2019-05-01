from django.shortcuts import render
import requests


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
        course = requests.get(request.build_absolute_uri('/api/model/course/' + id_to_edit + '/?format=json')).json()
        return render(request, 'viewcourse.html', context={'data': course})

    elif "subplan" in url:
        subplan = requests.get(request.build_absolute_uri('/api/model/subplan/' + id_to_edit + '/?format=json')).json()
        return render(request, 'viewsubplan.html', context={'data': subplan})

    elif "program" in url:
        program = requests.get(request.build_absolute_uri('/api/model/program/' + id_to_edit + '/?format=json')).json()

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

        for rule in program["rules"]:
            # For a subplan rule, GET the name of the subplan for display
            if rule["type"] == "subplan":
                subplans = {}
                for id in rule["ids"]:
                    subplan = requests.get(
                        request.build_absolute_uri('/api/model/subplan/' + str(id) + '/?format=json')).json()
                    subplans[id] = subplan["name"]
                rule["ids"] = subplans

        return render(request, 'viewprogram.html', context={'data': program})

from django import template
from django.template import Template

register = template.Library()


@register.simple_tag(takes_context=True)
def course_box(context, count, plan, display_course_index):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        if plan:
            course_name = plan['plan_courses'].pop(0)
        else:
            course_name = None

        # Noting that pop() might also return None if a user hasn't selected a course yet:
        if display_course_index:
            if course_name:
                output += "<div class=\"box grey-box\"><span class=\"grey-text\">Course #" + str(i + 1) + ":</span> " \
                          + course_name + "</div>"
            else:
                output += "<div class=\"box grey-text grey-box\">Course #" + str(i + 1) + ":</div>"
        else:
            if course_name:
                output += "<div class=\"box grey-box\"><span class=\"grey-text\">Course:</span> " \
                          + course_name + "</div>"
            else:
                output += "<div class=\"box grey-text grey-box\">Course:</div>"

    return Template(output).render(context)


@register.simple_tag(takes_context=True)
def course_box_with_values(context, count, courses, plan):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        if plan:
            course_name = plan['plan_courses'].pop(0)
        else:
            course_name = None

        if course_name is None:
            course_name = courses[i]['code']

        output += "<div class=\"box grey-box\"><span class=\"grey-text\">Course #" + str(i + 1) + ":</span> " \
                  + course_name + "</div>"

    return Template(output).render(context)


@register.simple_tag(takes_context=True)
def truncate_course_list(context, courses, cache_large_lists, count=5):
    if len(courses) > count and cache_large_lists:
        # Store this for later, and assign it an appendix id
        if not hasattr(context, "large_course_lists"):
            context.large_course_lists = {}

        id = len(context.large_course_lists) + 1  # Zero-indexed -> human readable

        context.large_course_lists[id] = courses

        return Template("See appendix #" + str(id) + ".").render(context)

    output = ""
    for i in range(0, len(courses)):
        output += str(courses[i]['code'])

        if i + 1 < len(courses):
            output += ", "

    return Template(output).render(context)


@register.simple_tag(takes_context=True)
def print_extended_course_lists(context):
    if not hasattr(context, "large_course_lists"):
        return Template("").render(context)

    output = "<div class=\"break-page\"></div>" \
             "<div class=\"columns-4 columns-no-gap\">" \
             "<h2>Appendix</h2>"

    for (id, courses) in context.large_course_lists.items():
        output += "<h3>Course List #" + str(id) + ":</h3>"

        output += "<div>"

        for i in range(0, len(courses)):
            output += str(courses[i]['code'])

            if i + 1 < len(courses):
                output += ", "

        output += "</div>"

    output += "</div>"

    return Template(output).render(context)

# https://stackoverflow.com/questions/4651172/reference-list-item-by-index-within-django-template/29664945#29664945
@register.filter
def index(List, i):
    return List.filter(id=int(i))[0]

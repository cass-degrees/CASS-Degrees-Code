from django import template
from django.template import Template

register = template.Library()


@register.simple_tag(takes_context=True)
def course_box(context, count, plan):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        if plan:
            course_name = plan['plan_courses'].pop(0)
        else:
            course_name = None

        # Noting that pop() might also return None if a user hasn't selected a course yet:
        if course_name:
            output += "<div class=\"box grey-box\"><span class=\"grey-text\">Course #" + str(i + 1) + ":</span> " \
                      + course_name + "</div>"
        else:
            output += "<div class=\"box grey-text grey-box\">Course #" + str(i + 1) + ":</div>"

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

# https://stackoverflow.com/questions/4651172/reference-list-item-by-index-within-django-template/29664945#29664945
@register.filter
def index(List, i):
    return List.filter(id=int(i))[0]

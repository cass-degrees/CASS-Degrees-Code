from django import template
from django.template import Template

register = template.Library()


@register.simple_tag(takes_context=True)
def course_box(context, count):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        output += "<div class=\"box grey-text grey-box\">Course #" + str(i + 1) + ":</div>"

    return Template(output).render(context)


@register.simple_tag(takes_context=True)
def course_box_with_values(context, count, courses):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        output += "<div class=\"box grey-box\"><span class=\"grey-text\">Course #" + str(i + 1) + ":</span> " \
                  + courses[i] + "</div>"

    return Template(output).render(context)

"""
Template tags specific to the student facing frontend. These generate interactive sections
for courses to be added.
"""

from django import template
from django.template import Template

register = template.Library()


@register.simple_tag(takes_context=True)
def student_course_box(context, count):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        output += "<div class=\"card selectable-card\">" \
                  "<div class=\"box-solid course-drop dropzone\">" \
                  "<span class=\"grey-text\">Course #" + str(i + 1) + ":&nbsp;</span>" \
                  "<span class=\"course-code\"></span>&nbsp;" \
                  "<input type=\"button\" class=\"course-clear-button\" onclick=\"clearCourse(this.parentElement)\" " \
                  "class=\"btn-uni-grad btn-snall\" value=\"Remove\" />" \
                  "</div></div>"

    return Template(output).render(context)


@register.simple_tag(takes_context=True)
def student_course_box_with_values(context, count, courses):
    output = ""
    iters = int(int(count) / 6)

    for i in range(iters):
        output += "<div class=\"card selectable-card\">" \
                  "<div data-course-code=\"" + courses[i] + "\" class=\"box-solid course-drop dropzone\">" \
                  "<span class=\"grey-text\">Course #" + str(i + 1) + ":&nbsp;</span>" \
                  "<span class=\"course-code\">" + courses[i] + "</span>" \
                  "</div>" \
                  "</div>"

    return Template(output).render(context)


# https://stackoverflow.com/questions/4651172/reference-list-item-by-index-within-django-template/29664945#29664945
@register.filter
def index(List, i):
    return List.filter(id=int(i))[0]


@register.filter
def get(List, i):
    return List[str(i)]

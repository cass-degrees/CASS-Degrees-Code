//! Basic utilities to handle serialization and deserialization of custom types (global requirements, rules)
//! which don't fit neatly into the regular HTML form list syntax.

// Terminology:
// (Global requirement) container: The entire fieldset + container for a singular global requirement.
// (Global requirement) inner container: Dynamic field inside a container containing options depending
//                                       on what rule type was selected.

Vue.component('global_requirement_general', {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("minmax")) {
                    value.minmax = "min";
                }
                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = 0;
                }
                if (!value.hasOwnProperty("subject_area")) {
                    value.subject_area = 'any';
                }
                if (!value.hasOwnProperty("courses1000Level")) {
                    value.courses1000Level = false;
                }
                if (!value.hasOwnProperty("courses2000Level")) {
                    value.courses2000Level = false;
                }
                if (!value.hasOwnProperty("courses3000Level")) {
                    value.courses3000Level = false;
                }
                if (!value.hasOwnProperty("courses4000Level")) {
                    value.courses4000Level = false;
                }
                if (!value.hasOwnProperty("courses5000Level")) {
                    value.courses5000Level = false;
                }
                if (!value.hasOwnProperty("courses6000Level")) {
                    value.courses6000Level = false;
                }
                if (!value.hasOwnProperty("courses7000Level")) {
                    value.courses7000Level = false;
                }
                if (!value.hasOwnProperty("courses8000Level")) {
                    value.courses8000Level = false;
                }
                if (!value.hasOwnProperty("courses9000Level")) {
                    value.courses9000Level = false;
                }
                if (!value.hasOwnProperty("customRequirements")) {
                    value.customRequirements = "";
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "invalid_units": false,
            "invalid_units_step": false,
            "units_is_blank": false,
            "is_invalid": false,
            "subject_areas": []
        }
    },
    created: function() {
        var rule = this;

        var request = new XMLHttpRequest();

        request.addEventListener("load", function() {
            rule.subject_areas = JSON.parse(request.response);
            var subject_areas = [];
            for (var index in rule.subject_areas) {
                let subject_area = rule.subject_areas[index]["code"].slice(0,4);
                // creates a unique list of subject_areas
                if (subject_areas.indexOf(subject_area) === -1) subject_areas.push(subject_area);
            }
            rule.subject_areas = subject_areas;
            rule.subject_areas.sort(
                function(a, b){
                    return a.localeCompare(b)
                }
            );
            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code&from=course");
        request.send();
    },
    methods: {
        check_options: function() {
            this.invalid_units = this.details.unit_count <= 0;
            this.invalid_units_step = this.details.unit_count % 6 !== 0;
            this.units_is_blank = this.details.unit_count === "";

            this.is_invalid = !this.details.courses1000Level && !this.details.courses2000Level && !this.details.courses3000Level
                && !this.details.courses4000Level && !this.details.courses5000Level && !this.details.courses6000Level
                && !this.details.courses7000Level && !this.details.courses8000Level && !this.details.courses9000Level
                && this.details.subject_area === "any";

            return !this.is_invalid && !this.invalid_units && !this.invalid_units_step && !this.units_is_blank;
        }
    },
    template: '#generalGlobalRequirementTemplate'
});

Vue.component('global_requirement', {
    props: {
        "details": {
            type: Object
        }
    },
    data: function() {
        return {
            component_names: GLOBAL_REQUIREMENT_NAMES,
            component_help: GLOBAL_REQUIREMENT_HELP,
            show_help: false,
        }
    },
    mounted: function() {
        var siblings = globalRequirementsApp.$children[0].$children;

        // Determine whether this rule is the most recent rule by finding which sibling
        // has the highest _uid assigned by Vue.
        var max = 0;
        var rule_creation_ranks = {};
        siblings.forEach(function(sib){
            rule_creation_ranks[sib._uid] = sib;
            sib.$el.classList.remove("rule_active_visual");
            max = (sib._uid > max) ? sib._uid : max;
        });
        var recent_rule = rule_creation_ranks[max];

        // Add a visual cue and scroll to the most recent rule
        recent_rule.$el.classList.add("rule_active_visual");
        recent_rule.$el.scrollIntoView({behavior: "smooth"})
    },
    template: '#globalRequirementTemplate'
});

// Contains a set of rules, with a button to add more
Vue.component('global_requirement_container', {
    props: {
        "global_requirements": {
            type: Array
        },
        // Message inserted between rules
        "separator": {
            type: String,
            default: ""
        }
    },
    data: function() {
        return {
            show_add_a_global_requirement_modal: false,
            add_a_global_requirement_modal_option: 'min',

            component_names: GLOBAL_REQUIREMENT_NAMES,

            // Forces the element to re-render, if mutable events occurred
            redraw: false,
        }
    },
    methods: {
        add_global_requirement: function() {
            this.show_add_a_global_requirement_modal = false;
            this.global_requirements.push({
                type: "general",
            });
        },
        remove: function(index) {
            this.global_requirements.splice(index, 1);
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#globalRequirementContainerTemplate'
});

/**
 * Submits the program form.
 */
function handleProgram() {
    var valid = true;
    for (var index in globalRequirementsApp.$children[0].$children){
        valid = valid && globalRequirementsApp.$children[0].$children[index].$children[0].check_options();
    }

    // Serialize list structures - this doesn't translate well over POST requests normally.
    document.getElementById("globalRequirements").value = JSON.stringify(globalRequirementsApp.global_requirements);

    return valid;
}

// Translation table between internal names for components and human readable ones.
const GLOBAL_REQUIREMENT_NAMES = {
    'general': "Global Requirement"
};

const GLOBAL_REQUIREMENT_HELP = {
    'general': "Enforces for an entire degree that a maximum or minimum amount of units must come from a particular " +
            "set of course levels or from particular subject areas - e.g. a minimum of 60 units must come from " +
            "completion of 3000 and 4000 level courses from the ARTV subject area. Multiple of these global " +
            "requirements may exist (e.g. if different unit counts are needed).",
};

var globalRequirementsApp = new Vue({
    el: '#globalRequirementsContainer',
    data: {
        global_requirements: []
    }
});

var reqs = document.getElementById("globalRequirements").value.trim();
if (reqs.length > 0) {
    var parsed = JSON.parse(reqs);
    if (parsed != null) {
        globalRequirementsApp.global_requirements = parsed;
    }
}

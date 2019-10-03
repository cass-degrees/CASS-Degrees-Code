Vue.component('rule_custom_text', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("text")) {
                    value.text = "";
                }

                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = "6";
                }

                if (!value.hasOwnProperty("show_course_boxes")) {
                    value.show_course_boxes = false;
                }

                return true;
            }
        }
    },
    data() {
        return {
            "not_divisible": false,
            "is_blank": false,
            // Grabs title of page to figure out the type [Course, Subplan, Program, List]
            "type": document.getElementById('page-title').innerText.split(' ')[1],
            "invalid_units": false,
            "is_blank": false
        }
    },
    created() {
        this.check_options();
        // Keep a copy of the Or Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
    },
    methods: {
        check_options(is_submission) {
            this.is_blank = this.details.text === "";

            this.invalid_units = this.details.unit_count <= 0;
            this.not_divisible = this.details.unit_count % 6 !== 0;

            return !this.not_divisible && !this.is_blank;
        },
        count_units() {
            return {"exact": parseInt(this.details.unit_count), "max": 0, "min": 0};
        },
        update_units() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
        },
    },
    template: '#customTextRuleTemplate'
});

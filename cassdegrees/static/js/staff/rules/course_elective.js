Vue.component('rule_elective', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = 24;
                }

                if (!value.hasOwnProperty("subject_area")) {
                    value.subject_area = "all";
                }

                if (!value.hasOwnProperty("year_level")) {
                    value.year_level = "all";
                }

                return true;
            }
        }
    },
    data() {
        return {
            "number_of_year_levels": 9,
            "subject_areas": [],
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "invalid_units": false,
            "invalid_units_step": false,
            "is_blank": false,

            "redraw": false
        }
    },
    created() {
        const rule = this;

        const request = new XMLHttpRequest();

        request.addEventListener("load", function () {
            rule.subject_areas = JSON.parse(request.response);
            const subject_areas = [];
            for (const index in rule.subject_areas) {
                let subject_area = rule.subject_areas[index]["code"].slice(0, 4);
                // creates a unique list of subject_areas
                if (subject_areas.indexOf(subject_area) === -1) subject_areas.push(subject_area);
            }
            rule.subject_areas = subject_areas;
            rule.subject_areas.sort(
                function (a, b) {
                    return a.localeCompare(b)
                }
            );
            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code&from=course");
        request.send();

        // Keep a copy of the Or Rule's "update_units" function (Or a blank function if unavailable)
        this.parent_update_units_fn = this.$parent.get_or_rule_update_units_fn();
    },
    methods: {
        check_options(is_submission) {
            // Ensure all data has been filled in
            this.is_blank = this.details.unit_count === "";

            // Ensure Unit Count is valid:
            if (this.details.unit_count !== "") {
                this.invalid_units = this.details.unit_count <= 0;
                this.invalid_units_step = this.details.unit_count % 6 !== 0;
            } else {
                this.invalid_units = false;
                this.invalid_units_step = false;
            }

            return !this.invalid_units && !this.invalid_units_step && !this.is_blank;
        },
        count_units() {
            return {"exact": parseInt(this.details.unit_count), "max": 0, "min": 0};
        },
        update_units() {
            // To be called whenever the unit count is updated. Will ask the OR rule to re-evaluate the unit count
            this.parent_update_units_fn();
            this.check_options();
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#electiveRuleTemplate'
});

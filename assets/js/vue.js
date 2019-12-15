Vue.component('modal', {
    props: ['courseSection', 'modalClass'],

    computed: {
        show: function () {
            // console.log(this.courseSection)
        },
        getEvent: function () {
            if (this.courseSection) {
                return this.courseSection.event
            }
        },
    },
    methods: {
        closeModalClick: function () {
            this.$parent.closeModal()
        }
    },
    template : "<div :class='this.modalClass' :data-event='getEvent'>" +
        "      <header class=\"cd-schedule-modal__header\">" +
        "        <div class=\"cd-schedule-modal__content\">{{this.show}}" +
        "          <h3 class=\"cd-schedule-modal__name\">{{this.courseSection.code}}</h3>\n" +
        "          <h4 class=\"cd-schedule-modal__name\">{{this.courseSection.courseTitle}}</h4>\n" +
        "        </div>" +
        "        <div class=\"cd-schedule-modal__header-bg\"></div>\n" +
        "      </header>" +
        "      <div class=\"cd-schedule-modal__body\">\n" +
        "        <div class=\"cd-schedule-modal__event-info\">" +
        "           <sectionselection :courses='this.courseSection'></sectionselection>" +
        "        </div>" +
        "        <div class=\"cd-schedule-modal__body-bg\" ></div>\n" +
        "      </div>" +
        "      <a href=\"#0\" v-on:click='this.closeModalClick' class=\"cd-schedule-modal__close text-replace\">Close</a>\n" +
        "    </div>"
})


Vue.component('sectionselection', {
    props: ['courses'],
    computed: {
        allTeachers: function () {
            let result = ''
            if (Object.keys(this.courses).includes('allmeetings')){
                Object.keys(this.courses.allmeetings).forEach(keys => {
                    let meeting = this.courses.allmeetings[keys];
                    meeting.instructors.forEach(instructor => {
                        result += (instructor + '(' + keys +'), ')
                    })
                })
                return result.slice(0,result.length-2)
            }

        }
    },
    methods: {
        getter: function(att){
            if (this.courses) {
                return this.courses[att]
            }
        },
    },
    template:
        '<div class="cd-schedule-modal__event-info">' +
            '<div>' +
                '<div>{{this.getter(\'courseDescription\')}}</div>' +
                '<div style="margin-top:10px">' +
                    '<div v-if="this.allTeachers !== \'\'">\n' +
                        '<strong>Instructor:</strong>\n' +
                        '<span>{{this.allTeachers}}</span>\n' +
                    '</div>'+
                    "<div v-if=\"this.getter(\'prerequisite\')\"><strong>Prerequisites:</strong>{{this.getter(\'prerequisite\')}}</div>" +
                    "<div v-if=\"this.getter(\'corequisite\')\"><strong>Corequisite: </strong>{{this.getter(\'corequisite\')}}</div>" +
                    "<div v-if=\"this.getter(\'exclusion\')\"><strong>Exclusions: </strong>{{this.getter(\'exclusion\')}}</div>" +
                    
                '</div>'+
            '</div>'+
        '</div>'
})


Vue.component('timetable', {
    props: ['time'],
    template: '<li><span>{{time}}</span></li>'
});


Vue.component('meeting', {
    props: ['meeting'],
    data: function(){
        return {
            style: {},
            meetingClassList: ['cd-schedule__event']
        }
    },
    computed: {
        courseCode: function () {
            return this.meeting['code']
        },
        courseTitle: function () {
            return this.meeting['courseTitle']
        },
        startTime: function () {
            return this.meeting['start']
        },
        endTime: function () {
            return this.meeting['end']
        },
        getStyle: function () {
            if (this.style) {
                return this.style
            }
        },
        dataevent: function () {
            return this.meeting.event
        }

    },
    mounted: function () {
        let duration = this.getScheduleTimestamp(this.endTime) - this.getScheduleTimestamp(this.startTime);
        let timelineStart = this.getScheduleTimestamp('9:00');
        let start = this.getScheduleTimestamp(this.startTime)
        let timelineUnitDuration = this.getScheduleTimestamp('10:00') - timelineStart;
        let slotHeight = this.$parent.$refs.header.offsetHeight;
        let eventTop = slotHeight*(start - timelineStart)/timelineUnitDuration - 1 + 'px';
        let eventHeight = slotHeight*duration/timelineUnitDuration + 1 + 'px';

        let slotWidth = this.$parent.$refs.header.offsetWidth;
        let node = this.$parent.sectionTodayDone[this.meeting.meetingId]
        let eventWidth = 100/node.processorTotal
        let eventLeft = eventWidth * (node.processor - 1) + '%'
        this.style = {'top': eventTop, 'height': eventHeight, 'width': eventWidth + "%", 'left': eventLeft};


    },
    methods: {
        getScheduleTimestamp: function (time) {
            //accepts hh:mm format - convert hh:mm to timestamp
            time = time.replace(/ /g,'');
            var timeArray = time.split(':');
            var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
            return timeStamp;
        },
        meetingClick: function () {
            this.$parent.$parent.openModal(this.courseCode)
            this.$parent.$parent.selectedMeeting = this
        },
        removeEventSelectedClass: function () {
            this.meetingClassList.splice(this.meetingClassList.indexOf('cd-schedule__event--selected'), 1);
        }
    },
    template: '<li :class="meetingClassList" :style="getStyle" v-on:click="meetingClick">' +
        '<a :data-start="this.startTime" :data-end="this.endTime" data-content="event-yoga-1" :data-event="this.dataevent" href="#0">' +
        '<em class="cd-schedule__name">{{this.courseCode}}</em>'+
        '<em class="cd-schedule__name">{{this.courseTitle}}</em>'+
        '</a></li>',

});

Vue.component('day', {
    props: ['semester', 'day', 'dayshort', 'sectionToday'],
    computed: {
        header: function () {
            return this.semester + "|" + this.day
        },
        sectionTodayDone: function () {
            let meetings = []
            for (let i=0;i<this.sectionToday.length;i++){
                let meeting = this.sectionToday[i];
                meetings.push(new Node(meeting.start, meeting.end, meeting.meetingId))
            }
            result = {}
            meetings.forEach(node => {
                node.setConflictGroup(meetings)
                delete node.conflictGroup
                result[node.id] = node
            });
            return result

        }
    },
    template:
        "<li class=\"cd-schedule__group\">" +
        "          <div class=\"cd-schedule__top-info\" ref=header><span>{{this.day}}</span></div>" +
        "          <ul>" +
        "            <meeting v-for=\"meeting in sectionToday\" :meeting=\"meeting\"></meeting>" +
        "          </ul>" +
        "        </li>"
})


var timetable = new Vue({
    el: '.single-timetable',
    data: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        daysshort: ['MO','TU','WE', "TH", "FR"],
        selections: {'VIC001Y1-Y-20199':['TUT-0101']},
        modalClassList: ['cd-schedule-modal'],
        selectedMeeting: undefined,
        currentModal: {},
        courses:
            {"VIC001Y1-Y-20199": {
                    "courseTitle": "Vic One Plenary",
                    "code": "VIC001Y1",
                    "courseDescription": "desctest",
                    "prerequisite": "",
                    "corequisite": "asdf",
                    "exclusion": "",
                    "section": "Y",
                    "meetings": {
                        "LEC-0101": {
                            "schedule": {
                                "WE-163117": {
                                    "meetingDay": "WE",
                                    "meetingStartTime": "16:00",
                                    "meetingEndTime": "18:00",
                                    "meetingScheduleId": "163117",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                }
                            },
                            "instructors": ['b'],
                            "teachingMethod": "LEC",

                        },
                        "TUT-0101": {
                            "schedule": {
                                "MO-167659": {
                                    "meetingDay": "MO",
                                    "meetingStartTime": "10:00",
                                    "meetingEndTime": "13:00",
                                    "meetingScheduleId": "167659",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                },
                                "TU-167660": {
                                    "meetingDay": "TU",
                                    "meetingStartTime": "10:00",
                                    "meetingEndTime": "13:00",
                                    "meetingScheduleId": "167660",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                },
                                "TU-167668": {
                                    "meetingDay": "TU",
                                    "meetingStartTime": "12:00",
                                    "meetingEndTime": "14:00",
                                    "meetingScheduleId": "167668",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                }
                            },
                            "instructors": ['a'],
                            "teachingMethod": "TUT",
                        },
                    },

                },

            }

    },
    computed: {
        times: function () {
            let time_list = [];
            for (let h=9;h<22;h++){
                if (h === 9){
                    h = '09'
                }
                time_list.push(h + ":" + '00');
            }
            return time_list
        },
        allSelectedCourses: function () {
            let result = {};

            for (let i=0;i<Object.keys(this.selections).length;i++){
                let key = Object.keys(this.selections)[i]
                let values = this.selections[key]
                values.forEach(value => {
                    result[key] = this.getCourseSectionInfo(key, value)
                    result[key]['event'] = 'event-' + i
                })
            }

            return result
        },
        sectionByDay: function () {
            let fall = {'MO': [], "TU": [], "WE": [], "TH": [], "FR": []};
            let winter = {'MO': [], "TU": [], "WE": [], "TH": [], "FR": []};
            let result = {'fall': fall, 'winter': winter};
            for (let i=0; i<Object.keys(this.allSelectedCourses).length; i++) {
                let courseInfo = Object.values(this.allSelectedCourses)[i]
                let schedule = courseInfo['meetings']['schedule'];
                for (let j=0;j<Object.keys(schedule).length;j++) {
                    let meeting = Object.values(schedule)[j];
                    let sectionInfoByDay = JSON.parse(JSON.stringify(courseInfo));
                    sectionInfoByDay['start'] = meeting.meetingStartTime;
                    sectionInfoByDay['end'] = meeting.meetingEndTime;
                    sectionInfoByDay['loc'] = meeting.assignedRoom1;
                    sectionInfoByDay['instructors'] = meeting.instructors;
                    sectionInfoByDay['meetingId'] = Object.keys(schedule)[j];
                    delete sectionInfoByDay.meetings;
                    if (courseInfo.section === 'Y' || courseInfo.section === 'F') {
                        result['fall'][meeting['meetingDay']].push(sectionInfoByDay)
                    }
                    if (courseInfo.section === 'Y' || courseInfo.section === 'S') {
                        result['winter'][meeting['meetingDay']].push(sectionInfoByDay)
                    }
                }
            }
            return result
        }

    },
    methods: {
        getCourseInfo: function (courseId) {
            if (this.courses[courseId]) {
                return this.courses[courseId];
            }
            let result_course = null
            Object.values(this.courses).forEach(course => {
                if (course.code === courseId) {
                    result_course = course
                }
            })
            return result_course
        },
        getCourseSectionInfo: function (courseId, sectionId) {
            let course = this.getCourseInfo(courseId);
            course['allmeetings'] =  course['meetings'];
            course['meetings'] =  course['meetings'][sectionId];
            course.selectedSectionId = sectionId;
            return course
        },
        openModal: function (courseId) {
            this.currentModal = this.getCourseInfo(courseId);
            // cd-schedule__event--selected add when an user select the event
            setTimeout(this.addClassEventSelect, 10);
            // cd-schedule-modal--open add when event been selected
            this.modalClassList.push('cd-schedule-modal--open');



            this.modalClassList.push('cd-schedule-modal--content-loaded');
            this.modalClassList.push('cd-schedule-modal--animation-completed')
        },
        closeModal: function () {
            this.modalClassList.splice(this.modalClassList.indexOf('cd-schedule-modal--content-loaded'), 1);
            this.modalClassList.splice(this.modalClassList.indexOf('cd-schedule__event--selected'), 1);
            this.modalClassList.splice(this.modalClassList.indexOf('cd-schedule-modal--animation-completed'), 1);
            this.selectedMeeting.removeEventSelectedClass()
            this.selectedMeeting = undefined
        },
        addClassEventSelect: function () {
            this.selectedMeeting.meetingClassList.push('cd-schedule__event--selected');
        }
    }
});










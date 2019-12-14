function Node(s, e, id) {
    this.start = getScheduleTimestamp(s);
    this.end = getScheduleTimestamp(e);
    this.id = id
}

function Interval() {
    this.processors = {1:[]}
}

Node.prototype.isConflictWith = function (other) {
    if (this.id === other.id){
        return false
    }
    // if this start before other start, and end after other start
    if (this.start < other.start && this.end > other.start){
        return true
    } else if (other.start < this.start && other.end > this.start){
        return true
    }
    return false
};

Node.prototype.getAllConflict = function(others) {
    let allConflicts = [];
    others.forEach(node => {
        if (node.isConflictWith(this)){
            allConflicts.push(node);
        }
    });

    return allConflicts
};

Node.prototype.setConflictGroup = function(others){
    if (this.conflictGroup) {
        return;
    }
    let candidates = [this];
    let seen = [this];
    let seen_id = [this.id];
    while (candidates.length > 0){
        let candidate = candidates.pop();
        let conflicts = candidate.getAllConflict(others);
        for (let i=0;i<conflicts.length;i++){
            let node = conflicts[i];
            if (!(seen_id.includes(node.id))){
                seen_id.push(node.id);
                candidates.push(node);
                seen.push(node)
            }
        }
    }
    seen.sort((x, y) => x.start > y.start?1:-1);
    let processors = setProcessor(seen)
    seen.forEach(node => {
        node.conflictGroup = seen
        node.processor = processors.getNode(node)
        node.processorTotal = Object.keys(processors.processors).length
    });
};

Interval.prototype.append = function(node) {
    flag = false
    Object.keys(this.processors).forEach(key => {
        let processor = this.processors[key];
        if (processor.length === 0){
            processor.push(node);
            flag = true
        }
        if (processor[processor.length -1].end <= node.start){
            processor.push(node);
            flag = true
        }
    });
    if (!flag){
        this.processors[Object.keys(this.processors).length + 1] = [node];
    }
};

Interval.prototype.getNode = function(node) {
    let processor_id = null
    Object.keys(this.processors).forEach(i => {
        let processor = this.processors[i];
        processor.forEach(n => {
            if (n.id === node.id){
                processor_id = i
            }
        })
    });
    return parseInt(processor_id)
}

setProcessor = function(nodes){
    let interval = new Interval();
    nodes.forEach(node => {
        interval.append(node)
    })
    return interval
};

getScheduleTimestamp = function (time) {
    //accepts hh:mm format - convert hh:mm to timestamp
    time = time.replace(/ /g,'');
    var timeArray = time.split(':');
    var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
    return timeStamp;
}

let a = new Node("10:00", "13:00", 1);
let b = new Node("9:00", "11:00", 2);
let c = new Node("12:00", "13:00", 3);
let d = new Node("11:00", "15:00", 4);
let e = new Node("17:00", "19:00", 5);
let f = new Node("16:00", "20:00", 6);
// let g = new Node("10:00", "13:00", 1);

let courses = [a,b,c,d,e,f];
// let courses = [a,b,c,d];
courses.forEach(node => {
    node.setConflictGroup(courses)
});
// console.log(a);
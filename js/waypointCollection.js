'use strict';


let WaypointCollection = function () {

    let self = {},
        data = [],
        maxWaypoints = 60,
        isValidMission = 0,
        countBusyPoints = 0,
        version = 0,
        center = {}
        
    self.getMaxWaypoints = function () {
        return maxWaypoints;
    };

    self.setMaxWaypoints = function (data) {
        maxWaypoints = data;
    };
    
    self.isValidMission = function () {
        return maxWaypoints == 1;
    };
    
    self.setValidMission = function (data) {
        isValidMission = data;
    };
    
    self.getCountBusyPoints = function () {
        return countBusyPoints;
    };

    self.setCountBusyPoints = function (data) {
        countBusyPoints = data;
    };
    
    self.getVersion = function () {
        return version;
    };

    self.setVersion = function (data) {
        version = data;
    };
    
    self.getCenter = function () {
        return center;
    };

    self.setCenterZoom = function (data) {
        center.zoom = data;
    };
    
    self.setCenterLon = function (data) {
        center.lon = data;
    };
    
    self.setCenterLat = function (data) {
        center.lat = data;
    };

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
    };
    
    self.isEmpty = function () {
        return data == [];
    };

    self.flush = function () {
        data = [];
    };

    self.getWaypoint = function(waypointId) {
        for (let waypointIndex in data) {
            if (data.hasOwnProperty(waypointIndex)) {
                let waypoint = data[waypointIndex];

                if (waypoint.getNumber() == waypointId ) {
                    return waypoint;
                }
            }
        }
    };
    
    self.updateWaypoint = function(newWaypoint) {
        if (newWaypoint.isUsed()) {
            data[newWaypoint.getNumber()] = newWaypoint;
        }
    };
    
    self.dropWaypoint = function(newWaypoint) {
        self.getWaypoint(newWaypoint.getNumber()).setUsed(false);
        let indexId = newWaypoint.getNumber()
        data.forEach(function (wp) {
            if (wp.getNumber() >= indexId) {
                wp.setNumber(wp.getNumber()-1);
            }
            if (wp.getAction() == MWNP.WPTYPE.JUMP && wp.getP1()>=indexId) {
                wp.setP1(wp.getP1()-1);
            }
        });
        data.splice(indexId, 1);

    };
    
    self.insertWaypoint = function (newWaypoint, indexId) {
        data.forEach(function (wp) {
            if (wp.getNumber() >= indexId) {
                wp.setNumber(wp.getNumber()+1);
            }
            if (wp.getAction() == MWNP.WPTYPE.JUMP && wp.getP1()>=indexId) {
                wp.setP1(wp.getP1()+1);
            }
        });
        data.splice(indexId, 0, newWaypoint);
    };

    
    self.drop = function (waypointId) {
        self.getWaypoint(waypointId).setUsed(false);
        var tmpData = [];
        let idx = 0;
        data.forEach(function (element) {
            if (element.isUsed()) {
                element.setNumber(idx)
                tmpData.push(element);
                idx++;
            }
        });

        data = tmpData;
    };
    
    self.update = function (bMWPfile=false) {
        let oldWPNumber = 0;
        let optionIdx = 0;
        let idx = 0;
        data.forEach(function (element) {
            if (element.isUsed()) {
                if (bMWPfile) {
                    element.setNumber(element.getNumber()-1);
                    if (element.getAction() == MWNP.WPTYPE.JUMP) {
                        element.setP1(element.getP1()-1);
                    }
                }
                if ([MWNP.WPTYPE.JUMP,MWNP.WPTYPE.SET_HEAD,MWNP.WPTYPE.RTH].includes(element.getAction())) {
                    element.setAttachedId(oldWPNumber);
                    element.setAttachedNumber(optionIdx);
                    element.setAttached(true);
                    optionIdx++;
                }
                else {
                    oldWPNumber = element.getNumber();
                    element.setLayerNumber(idx);
                    optionIdx = 0;
                    idx++;
                }
                if (element.getNumber() == self.get().length-1) {
                    element.setEndMission(0xA5);
                }
                else {
                    element.setEndMission(0);
                }
            }
        });
    };
    

    
    self.getAttachedList = function () {
        let tmpData = [];
        data.forEach(function (element) {
            if (element.isAttached()) {
                tmpData.push(element);
            }
        });

        return tmpData;
    } 
    
    self.getAttachedFromWaypoint = function (waypoint) {
        let tmpData = [];
        data.forEach(function (element) {
            if (element.isAttached() && element.getAttachedId() == waypoint.getNumber()) {
                tmpData.push(element);
            }
        });

        return tmpData;
    } 
    
    self.addAttachedFromWaypoint = function (waypoint) {
        let tmpNumber = 0;
        let tmpData = self.getAttachedFromWaypoint(waypoint);
        if (tmpData != 'undefined' && tmpData.length !=0) {
            tmpNumber = tmpData.length;
        }
        let tempWp = new Waypoint(waypoint.getNumber()+tmpNumber+1, MWNP.WPTYPE.JUMP, 0, 0);
        tempWp.setAttached(true);
        tempWp.setAttachedId(waypoint.getNumber());
        self.insertWaypoint(tempWp, waypoint.getNumber()+tmpNumber+1);
        self.update();
    } 
    
    self.dropAttachedFromWaypoint = function (waypoint, waypointAttachedNumber) {
        data.forEach(function (element) {
            if (element.isAttached() && element.getAttachedId() == waypoint.getNumber() && element.getAttachedNumber() == waypointAttachedNumber) {
                self.dropWaypoint(element);
                self.update();
            }
        });
        
    } 
    
    self.extractBuffer = function(waypointId) {
        let buffer = [];
        let waypoint = self.getWaypoint(waypointId);
        console.log("waypoint.getNumber() ",waypoint.getNumber());
        buffer.push(waypoint.getNumber());    // sbufReadU8(src);    // number
        buffer.push(waypoint.getAction());    // sbufReadU8(src);    // action
        buffer.push(specificByte(waypoint.getLat(), 0));    // sbufReadU32(src);      // lat
        buffer.push(specificByte(waypoint.getLat(), 1));
        buffer.push(specificByte(waypoint.getLat(), 2));
        buffer.push(specificByte(waypoint.getLat(), 3));
        buffer.push(specificByte(waypoint.getLon(), 0));    // sbufReadU32(src);      // lon
        buffer.push(specificByte(waypoint.getLon(), 1));
        buffer.push(specificByte(waypoint.getLon(), 2));
        buffer.push(specificByte(waypoint.getLon(), 3));
        buffer.push(specificByte(waypoint.getAlt(), 0));    // sbufReadU32(src);      // to set altitude (cm)
        buffer.push(specificByte(waypoint.getAlt(), 1));
        buffer.push(specificByte(waypoint.getAlt(), 2));
        buffer.push(specificByte(waypoint.getAlt(), 3));
        buffer.push(lowByte(waypoint.getP1())); //sbufReadU16(src);       // P1 speed or landing
        buffer.push(highByte(waypoint.getP1()));
        buffer.push(lowByte(waypoint.getP2())); //sbufReadU16(src);       // P2
        buffer.push(highByte(waypoint.getP2()));
        buffer.push(lowByte(waypoint.getP3())); //sbufReadU16(src);       // P3
        buffer.push(highByte(waypoint.getP3()));
        buffer.push(waypoint.getEndMission()); //sbufReadU8(src);      // future: to set nav flag
        
        return buffer;
    }

    return self;
};
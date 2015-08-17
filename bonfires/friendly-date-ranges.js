function strToParts(str) {
    var dateObj = new Date(str + ' GMT-0400');

    return [ dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate() ];
}
//strToParts('2015-07-01');

var currentYear = new Date().getUTCFullYear();

function isCurrentYear(parts) {
    return parts[0] === currentYear;
}
function isNextYear(parts) {
    return parts[0] === currentYear+1;
}

function compareParts(p1, p2) {
    if ( isCurrentYear(p1) ) {
        if ( isNextYear(p2) || isCurrentYear(p2) ) {
            p1[0]=''; p2[0]='';
        }
    } else {
        if ( p1[0]===p2[0] ) {
            p1[0]='';
        }
    }
    if ( p1[0]==='' && p2[0]==='' ) {
        if ( p1[1]===p2[1] ) {
            p2[1]='';
        }
    }
    return [p1, p2];
}

function toMonthStr(m) {
    var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if ( typeof m === 'number' ) {
        return months[m] + ' ';
    }
    return m;
}
function addNumberSuffix(n) {
    n = n.toString();
    switch(n) {
    case '1': return n + 'st';
    case '2': return n + 'nd';
    case '3': return n + 'rd';
    default: return n + 'th';
    }
}
function year(y) {
    if ( typeof y === 'number' ) {
        return ', ' + y.toString();
    }
    return y;
}
function displayParts(parts) {
    return toMonthStr(parts[1]) + addNumberSuffix(parts[2]) + year(parts[0]); 
}

function friendly(str) {

    if ( str[0]===str[1] ) {
        return [ displayParts(strToParts(str[0])) ];
    }
    
    return compareParts(strToParts(str[0]), strToParts(str[1]))
        .map(displayParts);
    //return [ strToParts(str[0]), strToParts(str[1]) ];
}

friendly(['2015-07-01', '2015-07-04']);

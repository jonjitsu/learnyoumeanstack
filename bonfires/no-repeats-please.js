function isEven(x) {
    return x%2===0;
}

function swap(a, x, y) {
    var tmp = a[x];
    a[x]=a[y];
    a[y]=tmp;
    return a;
}


function generate(a, fn) {
    return generateHelper(a.length, a, fn);
}

function generateHelper(n, a, fn) {
    if( n===1 ) fn(a);
    else {
        for (var i=0; i<n-1; i++ ) {
            generateHelper(n-1, a, fn);
            if( isEven(n) ) {
                swap(a, i, n-1);
            } else {
                swap(a, 0, n-1);
            }
        }
        generateHelper(n-1, a, fn);
    }
}
function generatePerms(a) {
    var all=[];
    generate(a, function(p) {
        all.push(p.slice());
    });
    return all;
}
function permAlone(str) {
    if( allTheSame(str) ) return 0;

    return generatePerms(str.split(''))
        .filter(hasNoRepeat)
        .length;

}

function hasNoRepeat(a) {
    return !hasRepeat(a);
}

function hasRepeat(a) {
    var i;
    for( i=a.length-2; i>=0; i-- ) {
        if ( a[i]===a[i+1] ) return true;
    }
    return false;
}

function allTheSame(str) {
    var i;
    var chars = str.split('');
    var sample = chars.pop();
    for(i=chars.length-1; i>=0; i--) {
        if( chars[i]!==sample ) return false;
    }
    
    return true;
}

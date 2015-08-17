

var Money = { 
  map3: [
    { type:'PENNY', value:0.01 },
    { type:'NICKEL', value:0.05 },
    { type:'DIME', value:0.1 },
    { type:'QUARTER', value:0.25 },
    { type:'ONE', value:1 },
    { type:'FIVE', value:5 },
    { type:'TEN', value:10 },
    { type:'TWENTY', value:20 },
    { type:'ONE_HUNDRED', value:100 }
  ],
  map: [
      [ 'ONE_HUNDRED', 100 ],
      [ 'TWENTY', 20 ],
      [ 'TEN', 10 ],
      [ 'FIVE', 5 ],
      [ 'ONE', 1 ],
      [ 'QUARTER', 0.25 ],
      [ 'DIME', 0.1 ],
      [ 'NICKEL', 0.05 ],
      [ 'PENNY', 0.01 ]
  ],
  map2: {
    PENNY: 0.01, NICKEL: 0.05, DIME: 0.1, QUARTER: 0.25, ONE: 1, 
    FIVE: 5, TEN: 10, TWENTY:20, ONE_HUNDRED: 100
  },
  getValue: function(type) {
   return this.map[type];
  }
};
function Register(cid) {
    this.cid = cid; 
}
Register.prototype = {
    constructor: Register,
    totalCashInDrawer: function() {
        return this.cid.reduce(
            function(sum, item) {
                return sum + Math.round(item[1]*100);
            }, 0
        ) / 100;
    },
    hasEnoughChange: function(change) {
        return cmpprice(this.totalCashInDrawer(), change)>=0;
    },
    typeAmount: function(name) {
        return this.cid.filter(function(item) { return item[0]===name; }).shift();
    },
    typeCount: function(name) {
        return this.typeAmount(name)[1]/Money.map2[name];
    },
    getChange: function(change) {
        change=change*100;
        var mmap = Money.map;
        var self = this;
        return mmap.reduce(function(c, type) {
            var name=type[0];
            var value=type[1]*100;
            if ( change>value ) {
                var count = Math.floor(change/value);
                var total = self.typeCount(name);
                if ( count>total ) count = total;
                var amount = count * value;
                change = change - amount;
                c.push([name, amount/100]);
            }
            return c;
        }, []);
    },
    doTransaction: function(price, cash) {
        var change = cash-price;
        if( !this.hasEnoughChange(change) ) return "Insufficient Funds";
        if( cmpprice(change, this.totalCashInDrawer())===0 ) return "Closed";
        return this.getChange(change);
    }
};
var cr0 = new Register([['PENNY', 1.01], ['NICKEL', 2.05], ['DIME', 3.10], ['QUARTER', 4.25], ['ONE', 90.00], ['FIVE', 55.00], ['TEN', 20.00], ['TWENTY', 60.00], ['ONE HUNDRED', 100.00]]);


function cmpprice(p1, p2) {
  p1 = Math.round(p1*100);
  p2 = Math.round(p2*100);
  return p1-p2;
}


function drawer(price, cash, cid) {
    return new Register(cid).doTransaction(price, cash);
}

drawer(19.50, 20.00, [['PENNY', 1.01], ['NICKEL', 2.05], ['DIME', 3.10], ['QUARTER', 4.25], ['ONE', 90.00], ['FIVE', 55.00], ['TEN', 20.00], ['TWENTY', 60.00], ['ONE HUNDRED', 100.00]]);

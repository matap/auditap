/**
 * Created by Stanislav Kadlcik
 * xkadlc03@fit.vutbr.cz
 */


/**
    * convert number to @size numbers before float point (add zeros)
    * and cut deciml numbers (max to 5)
    * @num number, what I want to convert
    * @size is count of numbers before float point
    * @decimal count of decimal numbers
    */
var pad = function (num, size, decimal) {
    if (decimal - 1 > 5) decimal = 5;
    var s = num.toFixed(decimal - 1) + "";
    while (s.length < size) s = "0" + s;
    return s;
}

/**
 * Convert time to user-friendly string
 * @time    time in seconds (floating point)
 * decimal  number of decimal numbers
 */
var convertTime = function (time, decimal) {
    var min = Math.floor(time / 60);
    return min + ":" + pad(time - min * 60.0, 2, decimal);
}

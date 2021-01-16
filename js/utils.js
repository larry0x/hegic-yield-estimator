// https://stackoverflow.com/questions/149055/
const formatNumber = (number, decPlaces) => {
  if (typeof number == 'string') {
    number = number.replace(/,/gi, '');
    number = parseFloat(number);
  }

  decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
  var sign = number < 0 ? '-' : '';
  var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
  var j = (j = i.length) > 3 ? j % 3 : 0;

  var formattedNumber = sign +
    (j ? i.substr(0, j) + ',' : '') +
    i.substr(j).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (decPlaces ? '.' + Math.abs(number - i).toFixed(decPlaces).slice(2) : '');

  console.log('Number formatted:', number, '<>', formattedNumber);
  return formattedNumber;
};

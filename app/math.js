define(function() {
	var ExtendedMath = {};
	ExtendedMath.constants = {};
	ExtendedMath.constants.MAX_INT = Math.pow(2, 32) - 1;
	ExtendedMath.constants.MIN_INT = -1 * (Math.pow(2, 32) - 1);
	ExtendedMath.min = function(func, data) {
		return _.reduce(data, function(memo, value, index, list) {
			return Math.min(memo, func(value, index));
		}, ExtendedMath.constants.MAX_INT);
	};
	ExtendedMath.max = function(func, data) {
		return _.reduce(data, function(memo, value, index, list) {
			return Math.max(memo, func(value, index));
		}, ExtendedMath.constants.MIN_INT);
	};

	return ExtendedMath;
});
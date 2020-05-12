// expand(3, 2) returns "($1, $2), ($3, $4), ($5, $6)" 
const expand = (rowCount, columnCount, startAt = 1) => {
    var index = startAt;
    return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ");
}

// flatten([[1, 2], [3, 4]]) returns [1, 2, 3, 4]
const flatten = (arr) => {
    var newArr = []
    arr.forEach(v => v.forEach(p => newArr.push(p)));
    return newArr
}

module.exports = {
    expand,
    flatten
}
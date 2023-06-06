const dataMaker = function (count) {
    let nodes = [], pId = -1,
        min = 10, max = 90, level = 0, curLevel = [], prevLevel = [], levelCount,
        i = 0, j, l, m;

    while (i < count) {
        if (level === 0) {
            pId = -1;
            levelCount = Math.round(Math.random() * max) + min;
            for (j = 0; j < levelCount && i < count; j++, i++) {
                let n = {id: i, pId: pId, key: "key-" + i};
                nodes.push(n);
                curLevel.push(n);
            }
        } else {
            for (l = 0, m = prevLevel.length; l < m && i < count; l++) {
                pId = prevLevel[l].id;
                levelCount = Math.round(Math.random() * max) + min;
                for (j = 0; j < levelCount && i < count; j++, i++) {
                    let n = {id: i, pId: pId, key: "key-" + i};
                    nodes.push(n);
                    curLevel.push(n);
                }
            }
        }
        prevLevel = curLevel;
        curLevel = [];
        level++;
    }
    const root = {
        id: -1,
        pid: -2,
        key: 'key-root'
    }
    nodes.unshift(root);
    return nodes;
}
export default dataMaker(13000);
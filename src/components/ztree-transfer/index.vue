<template>
    <div class="treeList-wrapper flex-between">
        <!--待选列表-->
        <div class="treeList facultyList-left">
            <div class="treeList-header facultyList-header flex-between fz-16r">
                <div>待选列表</div>
                <div>{{ leftCheckedLeaf }}/{{ leftTotalLeaf }}项</div>
            </div>
            <div class="treeList-body facultyList-body">
                <div v-show="loading || leftLoading" class="flex-center" style="height: 100%;">
                    <a-spin size="large"></a-spin>
                </div>
                <div v-show="!loading && !leftLoading">
                    <a-input :id="leftSearchId" v-model="leftSearchContent" placeholder="按关键字搜索（回车确认）"/>
                    <div v-show="leftHasNode">
                        <ul :id="leftTreeDomId" class="ztree"></ul>
                    </div>
                    <div v-show="!leftHasNode" class="empty">
                        <a-empty :description="false"></a-empty>
                    </div>
                </div>
            </div>
        </div>
        <!--按钮-->
        <div class="f-btn-group flex-col-x">
            <a-button size="large" @click="toRight">
                <a-icon type="double-right"/>
            </a-button>
            <a-button size="large" class="mt-20r" @click="toLeft">
                <a-icon type="double-left"/>
            </a-button>
        </div>
        <!--已选列表-->
        <div class="treeList facultyList-right pr">
            <div class="treeList-header facultyList-header flex-between fz-16r">
                <div>已选列表</div>
                <div>{{ rightCheckedLeaf }}/{{ rightTotalLeaf }}项</div>
            </div>
            <div class="treeList-body facultyList-body">
                <div v-show="loading || rightLoading" class="flex-center" style="height: 100%;">
                    <a-spin size="large"></a-spin>
                </div>
                <div v-show="!loading && !rightLoading">
                    <a-input :id="rightSearchId" v-model="rightSearchContent" placeholder="按关键字搜索（回车确认）"/>
                    <div v-show="rightHasNode">
                        <ul :id="rightTreeDomId" class="ztree"></ul>
                    </div>
                    <div v-show="!rightHasNode" class="empty">
                        <a-empty :description="false"></a-empty>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from "jquery";
    import "./assets/js/jquery.ztree.core.min";
    import "./assets/js/jquery.ztree.excheck.min";
    import "./assets/js/jquery.ztree.exhide.min";
    import "./assets/css/zTreeStyle/zTreeStyle.css";
    import originData from "./assets/data";

    export default {
        name: "ZTreeTransfer",
        data() {
            return {
                // 定义标签的id，如果组件复用，可以使用props传递
                leftTreeDomId: 'leftTree',
                rightTreeDomId: 'rightTree',
                leftSearchId: 'leftSearch',
                rightSearchId: 'rightSearch',

                leftTree: {}, // treeObj
                leftNodes: [], // 初始参数
                leftFlattenNodes: [], // 扁平化
                rightTree: null,
                rightFlattenNodes: [], // 扁平化
                rightNodes: [], // 记录右树初始展示的节点，因为节点可能被隐藏，用于搜索功能

                // 用于check回调
                checkedLeafs: [],

                // 显示（被选）叶子节点总数
                leftTotalLeaf: 0,
                leftCheckedLeaf: 0,
                rightTotalLeaf: 0,
                rightCheckedLeaf: 0,

                leftHasNode: false, // 当前树是否有展示节点
                rightHasNode: false,

                leftSearchState: false, // 是否在搜索状态
                rightSearchState: false,
                leftSearchContent: '',
                rightSearchContent: '',

                loading: true,
                leftLoading: false,
                rightLoading: false,
                loadingTime: 100,
            }
        },
        methods: {
            // 模糊查询
            fuzzySearch(zTreeId, searchField, getTreeNodes) {
                const zTreeObj = $.fn.zTree.getZTreeObj(zTreeId);//get the ztree object by ztree id
                const nameKey = zTreeObj.setting.data.key.name; //get the key of the node name

                // keywords filter function
                const ztreeFilter = (zTreeObj, _keywords, input) => {
                    if (!_keywords) {
                        _keywords = ''; //default blank for _keywords
                    }

                    // function to find the matching node
                    function filterFunc(node) {
                        if (node && node.oldname && node.oldname.length > 0) {
                            node[nameKey] = node.oldname; //recover oldname of the node if exist
                        }
                        zTreeObj.updateNode(node); //update node to for modifications take effect

                        //transform node name and keywords to lowercase
                        if (node[nameKey] && node[nameKey].toLowerCase().indexOf(_keywords.toLowerCase()) !== -1) {
                            zTreeObj.showNode(node);//show node with matching keywords
                            return true; //return true and show this node
                        }

                        zTreeObj.hideNode(node); // hide node that not matched
                        return false; //return false for node not matched
                    }

                    const setTreeState = (hasNode, searchState) => {
                        if (zTreeId === this.leftTreeDomId) {
                            this.leftHasNode = hasNode
                            this.leftSearchState = searchState;
                            this.leftLoading = false;
                        } else {
                            this.rightHasNode = hasNode;
                            this.rightSearchState = searchState;
                            this.rightLoading = false;
                        }
                    }


                    if (zTreeId === this.leftTreeDomId) {
                        this.leftLoading = true;
                    } else {
                        this.rightLoading = true;
                    }
                    setTimeout(() => {
                        const treeNodes = getTreeNodes();
                        //process the ancient nodes if _keywords is not blank
                        if (_keywords.length > 0) {
                            let nodesShow = treeNodes.filter(filterFunc); // get all nodes that would be shown,不含父节点
                            nodesShow.forEach(node => {
                                nodesShow = Array.from(new Set([...node.getPath(), ...nodesShow])); // 获取所有要展示的节点
                            });
                            zTreeObj.showNodes(nodesShow);
                            zTreeObj.expandAll(true);
                            setTreeState(!!nodesShow.length, true);
                        } else { //show all nodes when _keywords is blank and expand the root nodes
                            zTreeObj.showNodes(treeNodes);
                            const secondNodes = zTreeObj.getNodesByParam('level', '1');//get all root nodes
                            $.each(secondNodes, function (n, obj) {
                                zTreeObj.expandNode(obj, false, true); //expand all root nodes
                            });
                            setTreeState(!!treeNodes.length, false);
                        }
                        this.loading = false;
                        setTimeout(() => {
                            input.focus();
                        });
                    }, this.loadingTime);

                }

                $(searchField).bind('keypress', function (e) {
                    if (e.keyCode === 13) {
                        let _keywords = $(this).val();
                        ztreeFilter(zTreeObj, _keywords, this);
                    }
                });
            },
            // 获取数据
            getData() {
                // 定时器模拟从接口获取数据
                setTimeout(() => {
                    this.leftNodes = originData;
                    const echoData = ['1598552881013854211', '1661973549545558016']; // 回显数据，这里是有序id集合
                    // 初始化树
                    this.leftTree = this.initTree(this.leftTreeDomId, this.leftNodes, this.leftSearchId);
                    this.leftFlattenNodes = this.leftTree.transformToArray(this.leftTree.getNodes());
                    this.rightTree = this.initTree(this.rightTreeDomId, this.leftNodes, this.rightSearchId);
                    this.rightFlattenNodes = this.rightTree.transformToArray(this.rightTree.getNodes());
                    // 获取叶子节点总数
                    this.leftTotalLeaf = this.leftTree.getNodesByFilter((node) => !node.isParent, false).length;
                    // 回显
                    if (echoData.length > 0) {
                        this.echoData(echoData);
                    } else {
                        this.rightTree.hideNodes(this.rightFlattenNodes); // 隐藏所有节点
                    }
                    if (this.leftFlattenNodes.length > 0) this.leftHasNode = true;
                    this.loading = false;
                }, 1000);
            },
            // 初始化树
            initTree(treeDomId, originNodes, inputId = null) {
                // 基础设置
                const setting = {
                    data: {
                        key: {
                            name: "key",
                        }
                    },
                    check: {
                        enable: true,
                        nocheckInherit: false
                    },
                    view: {
                        showIcon: false,
                        showLine: false,
                        showTitle: false,
                    },
                    callback: {
                        beforeCheck: (treeId, node) => {
                            const tree = treeId === this.leftTreeDomId ? this.leftTree : this.rightTree;
                            if (node.isParent) {
                                // 获取当前节点下的所有叶子节点
                                this.checkedLeafs = JSON.parse(JSON.stringify(tree.getNodesByFilter(child => !child.isParent && !child.isHidden, false, node)));
                            }
                            return true;
                        },
                        onCheck: (event, treeId, node) => {
                            let count;
                            if (node.isParent) {
                                const leafLen = this.checkedLeafs.length;
                                // 当前节点被选择前已经被选择的叶子节点
                                const checkedLen = this.checkedLeafs.filter(item => item.checked).length;
                                count = node.checked ? leafLen - checkedLen : checkedLen * -1;
                            } else {
                                count = node.checked ? 1 : -1;
                            }
                            if (treeId === this.leftTreeDomId) {
                                this.leftCheckedLeaf += count;
                            } else {
                                this.rightCheckedLeaf += count;
                            }
                        }
                    },
                };
                // 初始化树
                const treeObj = $.fn.zTree.init($('#' + treeDomId), setting, originNodes);
                // 只展开根节点
                treeObj.expandNode(treeObj.getNodeByParam('parentTId', null), true, false, false);
                if (inputId !== null) { // 绑定模糊查询
                    if (treeDomId === this.rightTreeDomId) { // 右
                        this.fuzzySearch(treeDomId, '#' + inputId, () => {
                            return this.rightNodes;
                        });
                    } else { // 左
                        this.fuzzySearch(treeDomId, '#' + inputId, () => {
                            return this.leftFlattenNodes;
                        });
                    }
                }
                return treeObj;
            },
            // 左穿梭
            toLeft() {
                this.loading = true;
                setTimeout(() => {
                    if (!this.leftSearchState) {
                        this.leftTree.showNodes(this.leftFlattenNodes); // 穿梭时展示全部
                    }
                    if (!this.rightSearchState) {
                        this.rightTree.showNodes(this.rightNodes);
                    }
                    const rightCheckNodes = this.rightTree.getNodesByFilter(node => node.checked);
                    const nodes = [];
                    rightCheckNodes.forEach(node => {
                        const checkChildState = node.check_Child_State;
                        if (checkChildState === -1 || checkChildState === 2) {
                            nodes.push(node); // 获取叶子节点或全选节点（即子孙节点全选）
                        }
                    });
                    this.rightTotalLeaf -= this.rightCheckedLeaf;
                    let lIdx = 0, rIdx = 0;
                    while (rIdx < rightCheckNodes.length) { // 同步左树勾选状态
                        const lNode = this.leftFlattenNodes[lIdx];
                        const rNode = rightCheckNodes[rIdx];
                        if (lNode.id === rNode.id) {
                            if (!rNode.isParent) {
                                this.leftTree.checkNode(lNode, false, true, true);
                                this.rightTree.checkNode(rNode, false, true, true);
                            }
                            rIdx++;
                        }
                        lIdx++;
                    }
                    this.rightTree.hideNodes(nodes); // 比使用hideNode性能好
                    let showNodes = $(this.rightNodes).not(nodes).toArray(); // 求差集，即右树应全部显示的节点，但不含父节点
                    showNodes.forEach(node => {
                        showNodes = Array.from(new Set([...node.getPath(), ...showNodes])); // 获取所有要展示的节点
                    });
                    this.rightHasNode = !!this.rightTree.getNodesByFilter(node => !node.isHidden).length;
                    this.rightNodes = showNodes;
                    this.leftSearchContent = '';// 清空搜索内容
                    this.loading = false;
                }, this.loadingTime);
            },
            // 右穿梭
            toRight() {
                this.loading = true;
                this.rightTree.hideNodes(this.rightFlattenNodes); // 隐藏所有节点，不兼容exedit扩展
                setTimeout(() => {
                    const leftCheckNodes = this.leftTree.getNodesByFilter(node => node.checked); // 获取左树勾选节点，包括隐藏的
                    this.rightTotalLeaf = 0;
                    let lIdx = 0, rIdx = 0;
                    let nodes = [];
                    /**
                     * rightFlattenNodes和leftCheckNodes是有序的
                     * 因此使用一层循环即可取出右树应展示节点
                     */
                    while (lIdx < leftCheckNodes.length) {
                        const lNode = leftCheckNodes[lIdx];
                        const rNode = this.rightFlattenNodes[rIdx];
                        if (lNode.id === rNode.id) {
                            if (!rNode.isParent) ++this.rightTotalLeaf; // 统计右树显示的叶子节点个数
                            nodes.push(this.rightFlattenNodes[rIdx]); // 获取对应右树节点
                            lIdx++;
                        }
                        rIdx++;
                    }
                    // 搜索后进行穿梭，如果取消选中父节点（仍有选中的子节点），则需要获取该节点
                    let showNodes = [];
                    nodes.forEach(node => {
                        showNodes = Array.from(new Set([...node.getPath(), ...showNodes])); // 获取所有要展示的节点
                    });
                    this.rightNodes = showNodes;// 穿梭时展示全部
                    this.rightTree.showNodes(showNodes); // 显示左树勾选节点
                    this.rightHasNode = !!this.rightNodes.length;
                    this.rightSearchContent = ''; // 清空搜索内容
                    this.loading = false;
                }, this.loadingTime);
            },
            // 回显数据
            echoData(ids) {
                // ids.forEach(id => {
                //     leftTree.checkNode(leftTree.getNodeByParam('id', id), true, true, true);
                // })
                let i = 0, j = 0;
                while (i < ids.length) {
                    if (ids[i] === this.leftFlattenNodes[j].id) {
                        this.leftTree.checkNode(this.leftFlattenNodes[j], true, true, true);
                        i++;
                    }
                    j++;
                }
                this.toRight();
                this.rightHasNode = true;
            },
        },
        mounted() {
            this.getData();
        }
    }
</script>

<!--组件样式-->
<style scoped lang="less">
    @border-color: #e8e8e8;

    .flex-center {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .flex-between {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .flex-col-x {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .treeList-wrapper {
        width: 1000px;
        margin: 10vh auto;
    }

    .treeList {
        width: 400px;
        border: 1px solid @border-color;
    }

    .treeList-header {
        padding: 20px;
        border-bottom: 1px solid @border-color;
    }

    .treeList-body {
        padding: 20px;
        height: 500px;
        overflow-y: auto;

        .empty {
            margin-top: 115px;
        }
    }

    .f-btn-group {
        width: 50px;
        height: 100px;
    }
</style>
<!--zTree样式-->
<style lang="less" scoped>
    .zt {
        display: flex;
    }

    .zt-tree {
        width: 300px;
        height: 300px;
        border: 1px solid #d6d8de;
    }

    .control {
        display: block;
        width: calc(100% - 32px);
        margin-left: 16px;
        margin-right: 16px;
        box-sizing: border-box;
        height: 32px;
        padding: 3px;
        margin-top: 10px;
    }

    .zt-btns {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 50px;
    }

    .zt-btn {
        display: inline-block;
        width: 30px;
        height: 30px;
        cursor: pointer;
    }

    .zt-btn-disable {
        opacity: .8;
        color: #ddd;
        cursor: not-allowed;
    }
</style>
<!--zTree样式-->
<style lang="less">
    .ztree li {
        line-height: 28px;
        font-size: 14px;
    }

    .ztree * {
        font-family: "PingFang SC", "Microsoft YaHei", "微软雅黑", "Helvetica Neue", Helvetica, "Hiragino Sans GB", Arial, sans-serif;
    }

    // 箭头
    .ztree li span.button.noline_open,
    .ztree li span.button.noline_close {
        background-image: none;
        display: inline-block;
        content: " ";
        width: 0;
        height: 0;
        border: 4px solid transparent;
        border-left-color: #595959;
        transition: all .2s ease-in-out;
        margin-left: 6px;
    }

    .ztree li span.button.noline_open {
        transform-origin: 25% 50%;
        transform: rotate(90deg);
    }

    // a
    .ztree li a {
        padding: 1px 3px 0 0;
        margin: 0;
        cursor: pointer;
        height: 17px;
        color: rgba(0, 0, 0, .65);
        background-color: transparent;
        text-decoration: none;
        vertical-align: top;
        display: inline-block;
    }

    .ztree li a:hover,
    .ztree li a.curSelectedNode {
        height: 17px;
        opacity: 1;
        color: inherit;
        background-color: transparent;
        border: 0;
        text-decoration: none;
        padding-top: 1px;
    }

    .ztree li a .node_name {
        font-size: 14px;
    }

    // 复选按钮
    .ztree li span.button.chk,
    .ztree li span.button.chk:hover {
        position: relative;
        width: 14px;
        height: 14px;
        border: 1px solid #d9d9d9;
        background-image: none;
        border-radius: 2px;
        margin-left: 4px;
        margin-right: 4px;
        background-color: #fff;
        cursor: pointer;
        transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
    }

    .ztree li span.button.chk:hover {
        border-color: #1890ff;
    }

    // 全选
    .ztree li span.button.chk.checkbox_true_full_focus:after,
    .ztree li span.button.chk.checkbox_true_disable:after,
    .ztree li span.button.chk.checkbox_true_full:after {
        display: table;
        box-sizing: border-box;
        content: " ";
        position: absolute;
        width: 10px;
        height: 16px;
        border: 3px solid #1890ff;
        top: -3px;
        left: 1px;
        border-top: 0;
        border-left: 0;
        transform: rotate(45deg) scale(0.5);
        transition: all .2s ease-in-out;
    }

    // 半选
    .ztree li span.button.chk.checkbox_true_part_focus,
    .ztree li span.button.chk.checkbox_true_part,
    .ztree li span.button.chk.checkbox_false_part {
        background-position: 0 0;
        position: relative;

        &:after {
            display: inline-block;
            position: absolute;
            content: " ";
            //left: 3px;
            //top: 6px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 2px;
            background-color: #1890ff;
        }
    }

    // 不选
    .ztree li span.button.chk.checkbox_false_full {
    }

    .ztree li span.button.chk.checkbox_true_disable {
        background: #f3f3f3;

        &:after {
            border-color: #424656;
        }
    }
</style>
var $ = function(sel) {
    return document.querySelector(sel);
};
var $All = function(sel) {
return document.querySelectorAll(sel);
};

var currentItem=null;        // 当前滑动的项，同时只能有一项滑动
var startPos=0;         // 触摸的起始x坐标
var startMargin=0;      // 触摸起始时的外边距
var minMarginLeft=-0.29;    // 外边距范围为0-29%
var contentWidth=$(".todoapp").clientWidth;

// 未完成项目个数
var todoNum=0;

// 储存数据
var storage=window.localStorage;


window.addEventListener("load",function(){
    // 当输入不为空时，才显示确认按钮
    bindButton($(".new-todo"),$(".new-confirm"));
    
    // 添加一项
    $(".new-confirm").addEventListener("touchstart",function(){
        this.style.background="#d9d9d9";
    });
    $(".new-confirm").addEventListener("touchend",function(){
        var value=$(".new-todo").value;
        addItem(value);
        $(".new-todo").value="";
        this.classList.add("hidden");
        this.style.background="#ffffff";
    });

    // 全选/全不选
    $(".toggle-all").addEventListener("change",function(){
        var itemList = $All(".todo-list li");
        if(this.checked){
            for(let item of itemList){
                item.classList.add("completed");
                item.querySelector(".toggle").checked=true;
            }
            todoNum=0;
            update();
        }
        else{
            for(let item of itemList){
                item.classList.remove("completed");
                item.querySelector(".toggle").checked=false;
            }
            todoNum=itemList.length;
            update();
        }
    });

    // 筛选器
    var filters = $All(".filters a");
    for(let filter of filters){
        filter.addEventListener("touchend",function(){
            for(let f of filters){
                f.classList.remove("selected");
            }
            filter.classList.add("selected");
            
            update();
        },false);
    }

    // 清空已完成
    $(".clear-completed").addEventListener("touchend",function(){
        var itemList=$All(".todo-list li");
        for(let item of itemList){
            if(item.classList.contains("completed")) item.remove();
        }
        update();
    },false);

    init();
});

// 读取localStorage,初始化
function init(){
    // 筛选器
    var filter=storage.getItem("filter");
    var filters = $All(".filters a");
    if(filter){
        for(let f of filters){
            f.classList.remove("selected");
            if(f.innerHTML==filter){
                f.classList.add("selected");
            }
        }
    }

    // 项目列表
    var itemList = JSON.parse(storage.getItem("TodoList"));
    if(itemList){
        for(let item of itemList){
            let li = addItem(item.Value);
            if(item.Completed){
                li.classList.add("completed");
                li.querySelector(".toggle").checked=true;
                todoNum--;  
            }
        }
    }

}

// 更新项目与数量的显示,并储存数据
function update(){
    var num="No";
    var str=" item left";
    if(todoNum>0)num=todoNum;
    if(todoNum>1)str=" items left";
    $(".todo-count").innerHTML=num+str;

    var itemList=$All(".todo-list li");
    var filter=$(".filters .selected").innerHTML;
    var itemsData=[];
    switch(filter){
        case "All":
            for(let item of itemList){
                item.classList.remove("hidden");
            }
            break;
        case "Active":
            for(let item of itemList){
                if(item.classList.contains("completed")) item.classList.add("hidden");
                else item.classList.remove("hidden");
            }
            break;
        case "Completed":
            for(let item of itemList){
                if(item.classList.contains("completed")) item.classList.remove("hidden");
                else item.classList.add("hidden");
            }
            break;
    }
    
    for(let item of itemList){
        var completed=item.classList.contains("completed");
        var value=item.querySelector(".todo-label").innerHTML;
        var itemData={
            "Value":value,
            "Completed":completed
        }
        itemsData.push(itemData);
    }
    
    storage.setItem("TodoList",JSON.stringify(itemsData));
    storage.setItem("filter",filter);
}

// 增加一项
function addItem(value){
    var li = document.createElement("li");
    todoNum++;
    
    // 加入内容
    li.innerHTML=[
        '<div class="view">',
        '   <input class="toggle" type="checkbox">',
        '   <label class="todo-label">'+value+'</label>',
        '   <input class="todo-edit" type="button" value="">',
        '   <input class="todo-delete" type="button" value="">',
        '</div>'
    ].join('');

    // 切换状态
    var toggle=li.querySelector(".toggle");

    toggle.addEventListener("touchmove",function(e){
        e.stopPropagation();
    });
    toggle.addEventListener("touchend",function(e){
        this.checked=!this.checked;
        if(this.checked){
            li.classList.add("completed");
            todoNum--;
            update();
        }
        else{
            li.classList.remove("completed");
            todoNum++;
            update();
        }
    });

 
    
    // 增加触摸滑动事件
    var item=li.querySelector(".view");
    item.style.marginLeft="0px";

    // 触摸开始时记录当前外边距与当前触摸点位置
    item.addEventListener("touchstart",function(e){
        if(currentItem!=null&&currentItem!=item){
            // 当滑动另一个物体时，把之前滑动的物体复原
            currentItem.style.marginLeft="0px";
        }
        currentItem=item;
        startPos=e.touches[0].clientX;
        startMargin=parseInt(item.style.marginLeft);
        e.preventDefault();
    });

    // 触摸移动过程中实时改变外边距达到滑动效果
    item.addEventListener("touchmove",function(e){
        var movePos=e.touches[0].clientX;
        var offset=movePos-startPos;
        item.style.marginLeft=startMargin+offset+"px";

        // 不能超出限定范围
        var left=parseInt(item.style.marginLeft);
        if(left>0){
            item.style.marginLeft="0px";
        }
        if(left<minMarginLeft*contentWidth){
            item.style.marginLeft=minMarginLeft*contentWidth+"px";
        }
        e.preventDefault();
    });

    // 触摸结束后根据滑动距离决定最终位置
    item.addEventListener("touchend",function(e){
        var endPos=e.changedTouches[0].clientX;
        var offset=endPos-startPos;

        // 根据滑动距离是否达到上限的一半确定最终位置
        left=item.style.marginLeft;
        if(offset<minMarginLeft*contentWidth/2||(offset>0&&offset<=minMarginLeft*contentWidth/-2)){
            item.animate([{marginLeft:left},{marginLeft:minMarginLeft*contentWidth+"px"}],{duration:200});
            item.style.marginLeft=minMarginLeft*contentWidth+"px";
        }
        else if(offset<=0||offset>minMarginLeft*contentWidth/-2){
            item.animate([{marginLeft:left},{marginLeft:"0px"}],{duration:200});
            item.style.marginLeft="0px";
        }
        //e.preventDefault();
    });

    // 删除按钮
    li.querySelector(".todo-delete").addEventListener("touchend",function(e){
        li.remove();
        todoNum--;
        update();
        e.stopPropagation();
    });

    // 编辑按钮
    li.querySelector(".todo-edit").addEventListener("touchend",function(e){
        li.classList.add("editing");
        var finished=false;
        // 编辑时创建一个文本框和确认按钮，编辑完后移除
        var text=document.createElement("input");
        text.setAttribute("type","text");
        text.setAttribute("value",li.querySelector(".todo-label").innerHTML)
        text.autofocus=true;
        text.classList.add("edit")
        var button = document.createElement("input");
        button.setAttribute("type","button");
        button.setAttribute("value","Confirm");
        button.classList.add("confirm");
        bindButton(text,button);
        text.addEventListener("blur",finish);
        button.addEventListener("touchstart",function(){
            this.style.background="#d9d9d9";
        });
        button.addEventListener("touchend",function(){
            li.querySelector(".todo-label").innerHTML=text.value;
            finish();
        });

        // 编辑完成后移除输入框和按钮，同时使项目变成未完成状态
        function finish(){
            if(finished){
                return;
            }
            finished=true;
            li.classList.remove("editing");
            text.remove();
            button.remove();
            item.style.marginLeft="0px";
            if(li.classList.contains("completed")){
                li.classList.remove("completed");
                toggle.checked=false;
                todoNum++;
                update();
            }
        }
        li.appendChild(text);
        li.appendChild(button);
        
        e.stopPropagation();
        
    });


    $(".todo-list").appendChild(li);
    update();
    return li;
}

function bindButton(text,button){
    text.addEventListener("input",function(){
        if(this.value.trim()!=""){
            button.classList.remove("hidden");
        }
        else{
            button.classList.add("hidden");
        }
    });
}
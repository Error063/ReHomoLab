console.log($.fn.jquery)

try{
    delete ql_images;
}catch (e){

}
let ql_images = document.currentScript.parentElement.getElementsByClassName('ql-editor')[0].getElementsByClassName("ql-image-box");
console.log(ql_images);
console.log(ql_images.item(0).className)
console.log(new Viewer(ql_images[0]));
for (let i = 0; i < ql_images.length; i++) {
    console.log(i);
    console.log(new Viewer(ql_images[i], () => {}));
}
$(".ql-fold").click(function() {
    $(this).toggleClass('expand');
});

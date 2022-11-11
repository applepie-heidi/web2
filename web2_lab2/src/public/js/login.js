
function toggle(el, infoId) {
    let cb = el; // document.getElementById("unsecure_sql");
    console.log("TOGGLED", cb.checked);
    document.getElementById(infoId).className = cb.checked ? "" : "hidden";
}

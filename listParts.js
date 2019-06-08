$.get('./parts.html', function(card){
    console.log($('#cards').append(card));

    console.log($('#list_parts'));
    
    $('#list_parts').on('click', e => {
	console.log(app.three.scene);
    })
})

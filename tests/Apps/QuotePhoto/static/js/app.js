var offset = 0;
var limit = 7;
var quoteIndex = 0;

var QuotePhoto = Ember.Application.create({
	ready : function() {
		this._super();
	}
});


/* Views */
QuotePhoto.ThumbnailPhotoView = Ember.View.extend({
	click : function(evt) {
		QuotePhoto.PhotoListController.set('selected', this.get('content'));
		//QuotePhoto.QuoteListController.set('selected', QuotePhoto.QuoteListController.get('content')[Math.floor(Math.random() * QuotePhoto.QuoteListController.get('length'))])
	},

	classNameBindings : "isSelected",

	isSelected : function() {
		//console.log(QuotePhoto.PhotoListController.get('selected') == this.get('content'));
		return QuotePhoto.PhotoListController.get('selected') == this.get('content');
	}.property('QuotePhoto.PhotoListController.selected')
});

QuotePhoto.ControlsView = Ember.View.extend({
	increase : function(event){
		var currentFontSize = $('.quote').css('font-size');
		var currentFontSizeNum = parseFloat(currentFontSize, 10);
	    var newFontSize = currentFontSizeNum*1.2;
	    $('.quote').css('font-size', newFontSize);
	},
	decrease : function(event){
		var currentFontSize = $('.quote').css('font-size');
		var currentFontSizeNum = parseFloat(currentFontSize, 10);
	    var newFontSize = currentFontSizeNum*.8;
	    $('.quote').css('font-size', newFontSize);
	},
	topIncrease : function(event){
	    $('.quote').css('top', parseFloat($('.quote').css('top')) + 10);
	},
	topDecrease : function(event){
	    $('.quote').css('top', parseFloat($('.quote').css('top')) - 10);
	},
	leftIncrease : function(event){
	    $('.quote').css('left', parseFloat($('.quote').css('left')) + 10);
	    $('.quote').css('width', parseFloat($('.quote').css('width')) - 10);
	},
	leftDecrease : function(event){
	    $('.quote').css('left', parseFloat($('.quote').css('left')) - 10);
	    $('.quote').css('width', parseFloat($('.quote').css('width')) + 10);
	},
	nextQuote : function(event){
		if(quoteIndex < QuotePhoto.QuoteListController.get('length'))
			quoteIndex++;
		
		QuotePhoto.QuoteListController.set('selected', QuotePhoto.QuoteListController.get('content')[quoteIndex]);
	
	},
	previousQuote : function(event){
		if(quoteIndex > 0)
			quoteIndex--;
		QuotePhoto.QuoteListController.set('selected', QuotePhoto.QuoteListController.get('content')[quoteIndex]);
	},
	randomize : function(event){
		QuotePhoto.QuoteListController.set('selected', QuotePhoto.QuoteListController.get('content')[Math.floor(Math.random() * QuotePhoto.QuoteListController.get('length'))])
		
		offset = Math.floor(Math.random() * 20) * limit;
		var randSelectedPhoto = Math.floor(Math.random() * limit);
		loadPhotoSet(randSelectedPhoto);
	},
	nextPhotoSet : function(event){
		offset += limit;
		loadPhotoSet(0);
		
	},
	previousPhotoSet : function(event){
		if(offset > 0){	
			offset -= limit;
			loadPhotoSet(0);
			
		}
	}
});

QuotePhoto.SelectedPhotoView = Ember.View.extend({

})	;

/* Controllers */
QuotePhoto.PhotoListController = Ember.ArrayProxy.create({
	content : [],
	selected : null
});

QuotePhoto.SelectedPhotoController = Ember.Object.create({
	contentBinding : 'QuotePhoto.PhotoListController.selected'
});

QuotePhoto.QuoteListController = Ember.Object.create({
	content : [],
	length : function(){
				return this.get('content').length;
			}.property('content'),
	selected : null 
});

QuotePhoto.QuoteController = Ember.Object.create({
	contentBinding: 'QuotePhoto.QuoteListController.selected'
});


function loadPhotoSet(selected) {
	var sort = '\'{"timestamp":-1}\'';
	
	$.getJSON('/query/getPhoto', {
		'offset' : offset,
		'limit' : limit,
		'sort' : sort
	}, function(photos) {
		if(photos.length == 0)
			return false;
		QuotePhoto.PhotoListController.set('content', photos);
		QuotePhoto.PhotoListController.set('selected', QuotePhoto.PhotoListController.get('content')[selected]);
	});
	
};

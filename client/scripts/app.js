 String.prototype.hashCode = function(){
  var hash = 0;
  if (this.length == 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
 }

var Message = Backbone.Model.extend({
  url : "http://127.0.0.1:3000/classes/messages",
  defaults : {username: '',
             text: '',
             objectId: ''}
});

var Messages = Backbone.Collection.extend({
  model : Message,
  url : "http://127.0.0.1:3000/classes/messages",
  filter : {
    order:"-updatedAt"
  },
  displayedMessages : {},
  friends: {},

  loadMessages: function (){
    this.fetch();
  },

  parse: function(response, options) {
    results = [];
    for (var i = response.results.length-1; i >= 0; i--) {
      results.push(response.results[i]);
    }
    return results;
  }
});

var FormView = Backbone.View.extend({

  events: {
    "click #sendMessageButton": "handleSubmit",
    "click #roomChoiceButton": "handleRoomChange"
  },

  initialize: function(){
    this.collection.on('sync', this.stopSpinner, this);
  },

  handleSubmit: function() {
    var $text = this.$('#sendMessageBoxText');
    var $user = this.$('#sendMessageBoxUser');

    this.startSpinner();

    var preHash = {
      username: $user.val(),
      text: $text.val()
    };

    preHash.objectId = JSON.stringify(preHash).hashCode();

    this.collection.create(preHash);

    $text.val('');
  },

  handleRoomChange: function() {
    var room = $('#roomChoiceText').val();
    this.collection.displayedMessages = {};

    this.startSpinner();

    if (room) {
      this.collection.filter.where = JSON.stringify({roomname: room});
    } else if (this.collection.filter.where) {
      delete this.collection.filter.where;
    }

    $('#messageBox').children().remove();

    this.collection.loadMessages();
  },

  startSpinner: function() {
    this.$('.spinner').show();
    this.$('#sendMessageButton').attr('disabled', 'true');
    this.$('#roomChoiceButton').attr('disabled', 'true');
  },

  stopSpinner: function() {
    this.$('.spinner').fadeOut('fast');
    this.$('#sendMessageButton').attr('disabled', null);
    this.$('#roomChoiceButton').attr('disabled', null);
  }

});

var MessageView = Backbone.View.extend({

  template: _.template('<div class="chat" data-id="<%= objectId %>"> \
                      <div class="user" data-user="<%- username %>"><%- username %></div> \
                      <div class="text"><%- text %></div> \
                      </div>'),

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this.$el;
  }
});

var MessagesView = Backbone.View.extend({

  events: {
    "click .user": "addFriend",
  },

  initialize: function() {
    this.collection.on('sync', this.render, this);
  },

  addFriend: function(event){
    var name = event.currentTarget.textContent;
    if(!this.collection.friends[name]){
      console.log("Adding " + name + " to friends list")
      this.collection.friends[name] = true;
      this.decorateFriend(name);
    }
    else {
      console.log("Removing " + name + " from friends list")
      delete this.collection.friends[name];
      this.unDecorateFriend(name);
    }

  },

  decorateFriend: function(name){
    $("[data-user='" + name + "']").addClass('friend');
  },

  unDecorateFriend: function(name){
    $("[data-user='" + name + "']").removeClass('friend');
  },

  render: function() {
    this.collection.forEach(this.renderMessage, this);
  },

  renderMessage: function(message) {
    if (!this.collection.displayedMessages[message.get('objectId')]) {
      var messageView = new MessageView({model: message});
      this.$el.prepend(messageView.render());
      this.collection.displayedMessages[message.get('objectId')] = true;
    }
  }
});
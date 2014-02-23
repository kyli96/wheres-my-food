var app = require('derby').
    createApp(module).
    use(require('derby-ui-boot'));

app.get('/', function(page, model, params, next) {
    // This value is set on the server in the `createUserId` middleware
    var userId = model.get('_session.userId');

    // Create a scoped model, which sets the base path for all model methods
    var user = model.at('users.' + userId);

    // mongo query to get menu items for the restaurant
    var itemsQuery = model.query('items', {restaurant: 1});
    // mongo query to get orders for the user
    var orderQuery = model.query('orders', {userId: userId});
    
    model.subscribe(user, itemsQuery, orderQuery, function() {
        model.ref('_page.user', user);
        itemsQuery.ref('_page.items');
        orderQuery.ref('_page.order');
        
        page.render('menu');
    });
});

app.get('/checkout', function(page, model, params, next) {
    // This value is set on the server in the `createUserId` middleware
    var userId = model.get('_session.userId');

    // Create a scoped model, which sets the base path for all model methods
    var user = model.at('users.' + userId);

    // mongo query to get orders for the user
    var orderQuery = model.query('orders', {userId: userId});
    
    model.subscribe(user, orderQuery, function() {
        model.ref('_page.user', user);
        orderQuery.ref('_page.order');
        
        page.render('checkout');  
    });
});

// CONTROLLER FUNCTIONS //

app.fn('order.add', function(e, el) {
    var orderItem = e.get(':item');
    if (!orderItem) return;
    var newOrder = {name: orderItem.name,
                    price: orderItem.price,
                    qty: 1};
    newOrder.userId = this.model.get('_session.userId');
    this.model.add('orders', newOrder);
});

app.fn('order.remove', function(e) {
    var item = e.get(':item');
    this.model.del('orders.' + item.id);
});

# Potion

[![Build Status](https://travis-ci.org/biosustain/potion-node.svg?branch=master)](https://travis-ci.org/biosustain/potion-node)
[![Dependency Status](https://gemnasium.com/badges/github.com/biosustain/potion-node.svg)](https://gemnasium.com/github.com/biosustain/potion-node)

> A TypeScript client for APIs written in Flask-Potion.

### Installation
----------------
You can install this package via [NPM](https://www.npmjs.com) or [Yarn](https://yarnpkg.com/en):
```shell
$(node bin)/npm install potion-client
```

It can also be used with [JSPM](http://jspm.io):
```shell
$(npm bin)/jspm install potion=npm:potion-client
```


### Usage
---------
Before you use this package, make sure you include [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) and a shim for ES6/7 features ([core-js](https://github.com/zloirock/core-js) has the most comprehensive collection of shims and I advise using it).

Furthermore, this package has multiple implementations available, it can be used as:
* [standalone](#standalone) package using [Fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) (make sure to include a polyfill such as [whatwg-fetch](https://github.com/github/fetch) if you are targeting a browser that does not implement the API);
* as a [AngularJS](#angularjs) module;
* as a [Angular 2](#angular-2) module.

Note that any routes created with `Route.<method>` and the following methods on `Item` return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise):
* `.save()`
* `.update()`
* `.destroy()`
* `.query()`
* `.fetch()`

#### Standalone
Using the package requires you to have a ES6 env setup with either [JSPM](http://jspm.io/) or [SystemJS](https://github.com/systemjs/systemjs) alone (or any loader that can load commonjs packages).

You will first need to load `Potion` and create an instance of it in order to be able to register any API endpoints:
```js
// It will load from the main module `potion/fetch`,
// and it will use the fetch API
import {
    ItemCache,
    Potion,
    Item
} from 'potion';

class CustomCache<T> implements ItemCache<T> {
    get(key: string): T {
        // logic to fetch the item from cache
    }
    put(key: string, item: T): T {
        // logic to cache and return the item
    }
    remove(key: string): {
        // logic to remove the item from cache
    }
}

let potion = new Potion({
    host: 'http://localhost:8080', // if you are hosting the api at a different host, defaults to ''
    prefix: '/api' // if all routes are at a specific path, defaults to ''
    cache: new CustomCache<Item>()
});
```

Now the API endpoints can be registered either using the `@potion.registerAs()` class decorator:
```js
// `Item` has been imported above,
// do not forget about it;
// and `potion` is the instance created in the above example
@potion.registerAs('/user')
class User extends Item {}
```

Or by using the `potion.register()` method:
```js
class User extends Item {}
potion.register('/user', User);
```

If there are some instance or static routes for an API endpoint that you wish to register, this can be done using:
```js
import {Route} from 'potion';

// Do not forget to load the Item and register the endpoint
class User extends Item {
    static names = Route.GET('/names');
    groups = Route.GET('/groups');
}
```

Furthermore, if you'd like to set some of the properties to read only (meaning that any requests to the backend will omit those properties), you can do it either directly on the resource using property decorators:
```js
import {Item, readonly} from 'potion';

class User extends Item {
    @readonly
    age;
}
```

Or you can do it when the resource is registered:
```js
import {Item} from 'potion';

@potion.registerAs('/user', {
    readonly: ['age']
})
class User extends Item {
    age;
}
```

Finally, to use the endpoints that were just created:
```js
// Fetch a user object by id
let user = User.fetch(1);

// Get the user groups,
// uses the instance route created with `Route.GET('/groups')`
user
    .then((user) => user.groups()})
    .then((groups) => {
        console.log(groups);
    });

// Get all user names,
// uses the static route created with `Route.GET('/names')`
let names = User.names();

// Get all users
let users = User.query();

// Update a user
user.then((john) => {
    john.update({name: 'John Doe'});
});

// Delete a user
user.then((john) => {
    john.destroy();
});

// Create and save a new user
let jane = new User({name: 'Jane Doe'});
jane.save();
```

When using the `.query()` method, you can provide additional params:
```js
let users = User.query({
    where: {name: 'John'}, // `where` can have any value
    sort: {name: false}, // and so can `sort`
    perPage: 50,
    page: 1
});

// Return paginated results
// Skip cache when making the request
let freshUsers = User.query(null, {
    paginate: true,
    cache: false
});
```

Furthermore, all Route methods (besides `DELETE`) accept additional params as well:
```js
class Car extends Item {
    static readEngines = Route.GET('/engines');
    writeSpecs = Route.POST('/specs');
}

// Get a car
let car = Car.fetch(1);

// Get all diesel engines
// Return paginated results
let engines = Car.engines({where: {type: 'Diesel'}}, {paginate: true});

// Create the car specs
car.then((car) => car.writeSpecs({
    engine: {type: 'Electric'}
}));
```

#### AngularJS
If you decide to use this package as a AngularJS module, there are a few differences from the standalone version, but the API does not change. Use the following example as a starting point:
```js
import angular from 'angular';
import {Item, Route, potion} from 'potion/angular';

angular
    .module('myApp', [
    	// `potion` is exported as an angular module
    	potion.name
    ])
    // Config the Potion client
    .config(['potionProvider', (potionProvider) => {
    	potionProvider.config({prefix: ''});
    }])
    // Register a resource
    .factory('User', ['potion', (potion) => {
    
        // Resources can also be registered using `@potion.registerAs('/user')`
        class User extends Item {
            name: string;
            
            static readNames = Route.GET('/names');
            readAttributes = Route.GET('/attributes');
        }

        // If the `@potion.registerAs('/user')` decorator is used,
        // this is no longer needed.
        return potion.register('/user', User);
    }])
    .controller('MyAppController', ['User', (User) => {
        // Fetch a user object by id
        let user = User.fetch(1);
        
        // Get the user attributes using the instance route created with `Route.GET('/attributes')`
        user
            .then((user) => user.readAttributes()})
            .then((attrs) => {
                console.log(attrs);
            });
        
        // Get all user names using the static route created with `Route.GET('/names')`
        let names = User.readNames();
        
        // Get all users
        let users = User.query();
        
        // Update a user
        user.then((john) => {
            john.update({name: 'John Doe'});
        });
        
        // Delete a user
        user.then((john) => {
            john.destroy();
        });
        
        // Create and save a new user
        let jane = new User({name: 'Jane Doe'});
        jane.save();
    }]);
```

#### Angular 2
Using the package in an Angular 2 app is very similar to the above, as in there are no API changes, but a few differences in the way resources are registered:
```js
// ./main.ts
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app.module.ts';

platformBrowserDynamic().bootstrapModule(AppModule);


// ./app.module.ts
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {POTION_RESOURCES, PotionModule} from 'potion-client/@angular';
// Load the App component
import {AppComponent} from './app.component';
// Load resources
import {resources} from './app.resources';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
		PotionModule
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent],
	providers: [
		// Potion resources registration
	    {
	        provide: POTION_RESOURCES,
	        useValue: resources,
	        multi: true
        }
     ]
})
export class AppModule {}


// ./app.resources.ts
import {PotionResources} from 'potion-client/@angular';
import {Engine, Car} from './vehicle';
export const resources: PotionResources = {
    '/engine': Engine,
    '/car': [Car, {
        readonly: ['production']
    }]
};


// ./app.component.ts
import {Component} from '@angular/core';
import {Car} from './vehicle';

@Component({
    selector: 'my-app',
    template: '<h1>My Angular 2 App</h1>'
})
export class AppComponent {
    constructor() {    
        let car = new Car({brand: 'Opel'});
        car.save();
    }
}


// ./vehicle.ts
import {Item} from 'potion/@angular';

export class Engine extends Item {}
export class Car extends Item {}
```

**NOTE**: It is **important** that `HttpModule` is provided as `Potion` uses `Http` as default http engine to make requests.

If you wish to override either one of the config values or provide your own http engine, you can use the following:
```js
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {POTION_HTTP, POTION_CONFIG, PotionHttp} from 'potion/@angular';
import {resources} from './app.resources';

// Custom Http
class MyHttp implements PotionHttp {}

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
		PotionModule,
		...
	],
	providers: [
        {
            provide: POTION_CONFIG,
            useValue: {
                prefix: '/api'
            }
        },
        {
            provide: POTION_HTTP,
            useClass: MyHttp
        },
        ...
    ],
	...
})
export class AppModule {}
```

Note that you can still register new resources at a later point by using the `Potion` instance (though I advise against it):
```js
import {Component} from '@angular/core';
import {Potion, Item} from 'potion/@angular';

export class Engine extends Item {}

@Component({
    selector: 'my-app',
    template: '<h1>My Angular 2 App</h1>'
})
class AppComponent {
    constructor(potion: Potion) {
        potion.register('/engine', Engine);
    }
}
```


### Contribute
----------------
Clone the repository `git clone https://github.com/biosustain/potion-node`, install all the deps (`npm install`) and start hacking.
Make sure that the builds and tests will run successfully, before you make a pull request. Follow the next steps:
- use `make build` to build the `.ts` files and see if any errors have occurred;
- run the tests using `make test` (*if you wish to run tests on file change, use `$(npm bin)/karma start karma.config.ts`.*);
- lint the code with `make lint`.

**Note**: If you add/remove files, make sure to edit the `"include"` field in `tsconfig.json`:
```js
{
    "include": [
        "src/@angular.ts",
        "src/angular.ts",
        "src/core.ts",
        "src/fetch.ts",
        "src/utils.ts"
    ]
}
```

**NOTE**: If you use the `prepublish` hook, it will also execute every time you do a `npm install` (see [scripts](https://docs.npmjs.com/misc/scripts)).
Thus, it is advised to use the command below to publish and build artifacts before publish, otherwise the TS compiler will throw errors.

Use the following command to publish the package:
```shell
make publish
```

/* NOTA BENE: il modello passato deve esser già stato fetchato / con dati validi. */

define(["backbone", "underscore", "jquery", "views/containers/AppComponentActionsView"],
function(Backbone, _, $, AppComponentActionsView) {
	
	var AppComponentView = Backbone.View.extend({

		template: undefined,
		tagName: "li",

		appComponentActionsView: undefined, // oggetto di tipo AppComponentActionsView

		initialize: function(options) {
			_.bindAll(this);

			// crea la vista per le azioni del componente
			this.appComponentActionsView = new AppComponentActionsView({
				collection: this.model.actions
			});

			this.listenTo(this.model, "change", this.render);

			// permette al componente di reagire ogni volta che viene aggiunta una sua nuova azione
			// (ad es. per calcolare un cambiamento di stato del componente)
			this.handleActions(); // per le azioni già esistenti
			this.listenTo(this.model.actions, "reset", this.handleActions);
			this.listenTo(this.model.actions, "add", this.handleAction);

			this.render();
		},

		// agisce sulle azioni correnti
		handleActions: function() {
			var actions = this.model.actions.models;
			for (var i=0,l=actions.length; i<l; i++) {
				this.handleAction(actions[i]);
			}
		},

		handleAction: function(action) {
			// il default è nessuna operazione, i sottotipi possono sovrascrivere il metodo con la propria logica
		},

		// restituisce i dati per il template, può essere sovrascritta dai sottotipi
		// per aumentarne / modificarne i dati restituiti.
		templateData: function() {
			var templateData = this.model.toJSON();
			// mantiene aperta la vista se lo era
			var isOpen = false;
			var appComponentEl = this.$(".appComponent");
			if (appComponentEl.length > 0) { // la vista è già stata renderizzata precedentemente
				isOpen = appComponentEl.hasClass("in");
			}
			templateData["isOpen"] = isOpen;

			return templateData;
		},

		render: function() {
			// remove .appComponent handlers to prevent memory leaks
			var appComponent = this.$('.appComponent');
			if (appComponent.length > 0) { appComponent.off(); }

			var templateData = this.templateData();
			this.el.innerHTML = this.template(templateData); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti
			// inserisce la vista con le azioni del componente
			this.$(".appComponentActions").append(this.appComponentActionsView.el);

			// evita di renderizzare l'html collassato per diminuire fortemente i tempi di rendering
			// quando l'app ha molti componenti
			var appComponent = this.$('.appComponent');
			if (!templateData['isOpen']) {
				appComponent.css("display", "none");
			}
			appComponent.on('hidden', function(event) { // fired just after the hide animation ends
			    if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
			        appComponent.css("display", "none");
			    }
				
			});
			appComponent.on('show', function(event) { // fired just before the show animation starts
			    if ($(event.target).is(appComponent)) { // don't handle if fired by child collapsable elements
			        appComponent.css("display", "block");
			    }
			});

			return this;
		},

		events: {
			"click .printAppComponent": "printAppComponent"
		},

		open: function() {
			// immediately open without animation
			var appComponent = this.$(".appComponent");
			appComponent.css("display", "block");
			appComponent.addClass("in");
			this.render(); // required to update the css setted by a previous close animation
		},

		close: function() {
			// immediately close without animation
			var appComponent = this.$(".appComponent");
			appComponent.removeClass("in");
			appComponent.css("display", "none");
			this.render();  // required to update the css setted by a previous open animation
		},

		highlightAnimation: function() {
			var animatedEl = this.$(".appComponentToggle");
			
			animatedEl.addClass("highlight");
			animatedEl.one("webkitAnimationEnd", _.bind(function() {
				animatedEl.removeClass("highlight");
			}, this));
		},

		printAppComponent: function() {
			this.model.printThis();
		}

    });
    return AppComponentView;
});
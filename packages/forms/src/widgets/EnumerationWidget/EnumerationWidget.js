import React, { PropTypes } from 'react';
import keycode from 'keycode';
import Enumeration from 'react-talend-components/lib/Enumeration';
import { manageCtrlKey, manageShiftKey, deleteSelectedItems, resetItems } from './utils/utils';

const DISPLAY_MODE_DEFAULT = 'DISPLAY_MODE_DEFAULT';
const DISPLAY_MODE_ADD = 'DISPLAY_MODE_ADD';
const DISPLAY_MODE_SEARCH = 'DISPLAY_MODE_SEARCH';
const DISPLAY_MODE_EDIT = 'DISPLAY_MODE_EDIT';
const DISPLAY_MODE_SELECTED = 'DISPLAY_MODE_SELECTED';
const DUPLICATION_ERROR = 'This term is already in the list';

const ENUMERATION_SEARCH_ACTION = 'ENUMERATION_SEARCH_ACTION';
const ENUMERATION_ADD_ACTION = 'ENUMERATION_ADD_ACTION';
const ENUMERATION_REMOVE_ACTION = 'ENUMERATION_REMOVE_ACTION';
const ENUMERATION_RENAME_ACTION = 'ENUMERATION_RENAME_ACTION';


class EnumerationWidget extends React.Component {
	constructor(props) {
		super(props);
		this.addInputs = [{
			disabled: true,
			label: 'Validate',
			icon: 'talend-check',
			id: 'validate',
			key: 'validate',
			onClick: this.onAddHandler.bind(this),
		}, {
			label: 'Abort',
			icon: 'talend-cross',
			id: 'abort',
			key: 'abort',
			onClick: this.onAbortHandler.bind(this),
		}];

		this.searchInputs = [{
			label: 'Abort',
			icon: 'talend-cross',
			id: 'abort',
			onClick: this.onAbortHandler.bind(this),
		}];

		this.defaultActions = [{
			disabled: false,
			label: 'Edit',
			icon: 'talend-pencil',
			id: 'edit',
			onClick: this.onEnterEditModeItem.bind(this),
		}, {
			label: 'Remove value',
			icon: 'talend-trash',
			id: 'delete',
			onClick: this.onDeleteItem.bind(this),
		}];

		this.state = {
			displayMode: DISPLAY_MODE_DEFAULT,
			required: (props.schema && props.schema.required) || false,
			headerDefault: [{
				label: 'Add item',
				icon: 'talend-plus',
				id: 'add',
				onClick: this.changeDisplayToAddMode.bind(this),
			}, {
				disabled: false,
				label: 'Search',
				icon: 'talend-search',
				id: 'search',
				onClick: this.changeDisplayToSearchMode.bind(this),
			}],
			headerSelected: [{
				label: 'Remove selected values',
				icon: 'talend-trash',
				id: 'delete',
				onClick: this.onDeleteItems.bind(this),
			}],
			headerInput: this.addInputs,
			items: (props.formData || []).map(item => ({
				values: item.values,
			})),
			itemsProp: {
				key: 'values',
				onSubmitItem: this.onSubmitItem.bind(this),
				onAbortItem: this.onAbortItem.bind(this),
				onChangeItem: this.onChangeItem.bind(this),
				onSelectItem: this.onSelectItem.bind(this),
				actionsDefault: this.defaultActions,
				actionsEdit: [{
					disabled: true,
					label: 'Validate',
					icon: 'talend-check',
					id: 'validate',
					onClick: this.onSubmitItem.bind(this),
				}, {
					disabled: false,
					label: 'Abort',
					icon: 'talend-cross',
					id: 'abort',
					onClick: this.onAbortItem.bind(this),
				}],
			},
			onInputChange: this.onInputChange.bind(this),
			onAddKeyDown: this.onAddKeyDown.bind(this),
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ ...this.state, items: nextProps.formData });
	}

	// default mode
	onEnterEditModeItem(event, value) {
		let items = resetItems([...this.state.items]);
		const item = items[value.index];
		item.displayMode = DISPLAY_MODE_EDIT;
		// resetting errors
		items[value.index].error = '';
		// reset selection
		items = items.map(currentItem => ({ ...currentItem, isSelected: false }));

		// exit from selected mode to not display 0 values selected
		let displayMode = this.state.displayMode;
		if (displayMode === DISPLAY_MODE_SELECTED) {
			displayMode = DISPLAY_MODE_DEFAULT;
		}

		this.setState({
			items,
			displayMode,
		});

		this.updateItemValidateDisabled(item.values[0]);
	}

	onSearchEditModeItem(event, value) {
		let items = resetItems([...this.state.items]);
		const item = items[value.index];
		item.displayMode = DISPLAY_MODE_EDIT;
		// reset selection
		items = items.map(currentItem => ({ ...currentItem, isSelected: false }));

		this.setState({
			items,
			displayMode: DISPLAY_MODE_EDIT,
		});

		this.updateItemValidateDisabled(item.values[0]);
	}

	onDeleteItem(event, value) {
		// dont want to fire select item on icon click
		event.stopPropagation();

		if (!this.callActionHandler(ENUMERATION_REMOVE_ACTION, value.index)) {
      const items = resetItems([...this.state.items]);
      items[value.index].displayMode = DISPLAY_MODE_DEFAULT;
      items.splice(value.index, 1);
      const countItems = items.filter(item => item.isSelected).length;

			let displayMode = this.state.displayMode;
			if (countItems === 0 && displayMode === DISPLAY_MODE_SELECTED) {
				displayMode = DISPLAY_MODE_DEFAULT;
			}
			this.setState({
				items,
				displayMode,
			}, this.setFormData.bind(this));
		}
	}

	// edit mode
	onAbortItem(event, value) {
		const items = [...this.state.items];
		items[value.index].displayMode = DISPLAY_MODE_DEFAULT;
		// resetting error as it was not saved
		items[value.index].error = '';
		this.setState({
			items,
			displayMode: 'DISPLAY_MODE_DEFAULT',
		});
	}

	// edit mode
	onChangeItem(event, value) {
		// if the value exist add an error
		const valueExist = this.valueAlreadyExist(value.value);
		const items = [...this.state.items];
		items[value.index].error = valueExist ? DUPLICATION_ERROR : '';
		this.setState({
			items,
		});
		this.updateItemValidateDisabled(value, valueExist);
	}

	onSubmitItem(event, value) {
		// dont want to fire select item on icon click
		event.stopPropagation();
		if (!this.callActionHandler(ENUMERATION_RENAME_ACTION, value.value)) {
			const items = [...this.state.items];
			items[value.index].displayMode = DISPLAY_MODE_DEFAULT;
			const valueExist = this.valueAlreadyExist(value.value);
			// if the value is empty, no value update is done
			if (value.value && !valueExist) {
				items[value.index].values[0] = value.value;
			}
			if (valueExist) {
				items[value.index].error = DUPLICATION_ERROR;
			}
			this.setState({
				items,
			}, this.setFormData.bind(this));
		}
	}

	onInputChange(event, value) {
		if (this.state.displayMode === DISPLAY_MODE_ADD) {
			this.updateHeaderInputDisabled(value.value);
		}
		if (this.state.displayMode === DISPLAY_MODE_SEARCH) {
			if (!this.callActionHandler(ENUMERATION_SEARCH_ACTION, value.value)) {
				this.setState({
					searchCriteria: value.value,
				});
			}
		}
	}

	onAbortHandler() {
		if (this.state.displayMode === DISPLAY_MODE_ADD) {
			this.updateHeaderInputDisabled('');
		}
		this.setState({
			displayMode: DISPLAY_MODE_DEFAULT,
			searchCriteria: null,
		});
	}

	onAddKeyDown(event, value) {
		if (event.keyCode === keycode('enter')) {
			event.stopPropagation();
			event.preventDefault();
			if (this.state.displayMode === DISPLAY_MODE_ADD) {
				this.onAddHandler(event, value);
			}
		}
		if (event.keyCode === keycode('escape')) {
			event.stopPropagation();
			event.preventDefault();
			this.onAbortHandler();
		}
	}

	onSelectItem(item, event) {
		let itemsSelected = resetItems([...this.state.items]);
		if (event.ctrlKey || event.metaKey) {
			itemsSelected = manageCtrlKey(item.index, this.state.items);
		} else if (event.shiftKey) {
			itemsSelected = manageShiftKey(item.index, this.state.items);
		} else {
			itemsSelected = itemsSelected.map(currentItem => ({ ...currentItem, isSelected: false }));
			itemsSelected[item.index].isSelected = true;
		}
		const countItems = itemsSelected.filter(currentItem => currentItem.isSelected).length;

		// if unselect all, return to default mode
		if (countItems === 0) {
			this.setState({
				items: itemsSelected,
				displayMode: DISPLAY_MODE_DEFAULT,
			});
		} else {
			this.setState({
				items: itemsSelected,
				displayMode: 'DISPLAY_MODE_SELECTED',
				itemsProp: {
					...this.state.itemsProp, actionsDefault: this.defaultActions,
				},
			});
		}
	}

	onDeleteItems() {
		const result = deleteSelectedItems([...this.state.items]);
		this.setState({
			displayMode: DISPLAY_MODE_DEFAULT,
			items: result,
		}, this.setFormData.bind(this));
	}

	onAddHandler(event, value) {
		if (!value.value) {
			this.setState({
				displayMode: DISPLAY_MODE_DEFAULT,
			});
			return;
		}

		if (!this.callActionHandler(ENUMERATION_ADD_ACTION, value.value)) {
			if (!this.valueAlreadyExist(value.value)) {
				this.setState({
					displayMode: 'DISPLAY_MODE_DEFAULT',
					items: this.state.items.concat([{
						values: [value.value],
					}]),
				}, this.setFormData.bind(this));
				this.updateHeaderInputDisabled('');
			}
		}
	}

	setFormData() {
		this.props.onChange(this.state.items);
		if (this.props.onBlur) {
			this.props.onBlur(this.props.id, this.state.items);
		}
	}

	callActionHandler(actionName, value) {
		if (this.props.registry &&
			this.props.registry.formContext &&
			this.props.registry.formContext.handleAction !== undefined) {
			this.props.registry.formContext.handleAction(
				this.props.id, actionName, value
			);
			return true;
		}
		return false;
	}

	searchItems(searchCriteria) {
		if (!searchCriteria) {
			return this.state.items;
		}
		const searchedItems = [];
		this.state.items.forEach((item) => {
			if (item.values &&
				item.values[0] &&
				item.values[0].toLowerCase().includes(searchCriteria.toLowerCase())
			) {
				searchedItems.push(item);
			}
		});

		return searchedItems;
	}

	changeDisplayToAddMode() {
		const items = resetItems([...this.state.items]);
		this.setState({
			items,
			headerInput: this.addInputs,
			displayMode: DISPLAY_MODE_ADD,
		});
	}

	changeDisplayToSearchMode() {
		const items = resetItems([...this.state.items]);
		this.setState({
			items,
			headerInput: this.searchInputs,
			displayMode: DISPLAY_MODE_SEARCH,
		});
	}

	valueAlreadyExist(value) {
		return this.state.items.find(item => item.values[0] === value);
	}

	updateHeaderInputDisabled(value) {
		this.setState((prevState) => {
			// checking if the value already exist
			const valueExist = this.valueAlreadyExist(value);
			const [validateAction, abortAction] = prevState.headerInput;
			validateAction.disabled = value === '' || valueExist;

			return {
				headerInput: [validateAction, abortAction],
				headerError: valueExist ? DUPLICATION_ERROR : '',
			};
		});
	}

	updateItemValidateDisabled(value, valueExist) {
		this.setState(() => ({
			currentEdit: {
				validate: {
					disabled: value.value === '' || valueExist !== undefined,
				},
			},
		}));
	}

	render() {
		const items = this.searchItems(this.state.searchCriteria);
		const stateToShow = { ...this.state, items };
		return (
			<div>
				<Enumeration
					{...stateToShow}
				/>
			</div>
		);
	}
}

if (process.env.NODE_ENV !== 'production') {
	EnumerationWidget.propTypes = {
		id: PropTypes.string,
		registry: PropTypes.object, // eslint-disable-line
		formData: PropTypes.array, // eslint-disable-line
		onChange: PropTypes.func.isRequired,
		onBlur: PropTypes.func,
		schema: PropTypes.object,
	};
}

export default EnumerationWidget;
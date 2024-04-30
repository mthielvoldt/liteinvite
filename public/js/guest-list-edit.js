//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestPostRoute = "/events/" + meetId + "/guests";
const guestListRoute = "/events/" + meetId + "/guests-full";
const guestDeleteRoute = "/events/" + meetId + "/guests/";
const invitesRoute = "/events/" + meetId + "/invites";

const rootElement = document.getElementById("guest-list");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [guests, setGuests] = useState([]);
    const xhrDelete = new XMLHttpRequest();
    xhrDelete.onload = () => { console.log(xhrDelete.responseText); };

    // calls updateList() once at page-load to populate the guest-list
    useEffect(updateList, []);

    function updateList() {
        fetch(guestListRoute)
            .then(res => res.json())
            .then((fetchedGuests) => {
                setGuests(fetchedGuests);
            })
            .catch(error => console.log(error));
    }

    function addGuest(newGuestEmail) {

        // Check to see if this email has been entered before (case-insensitive match)
        const hasMatch = guests.some((guest) => guest.email.toUpperCase() === newGuestEmail.toUpperCase());

        if (hasMatch) {
            console.log("email matches one previously entered.");
        } else {
            setGuests([...guests, { email: newGuestEmail, status: 0, sent: 0 }]);
        }
    }

    function deleteGuest(props) {
        xhrDelete.open("DELETE", guestDeleteRoute + props.guest.email);
        xhrDelete.send();
        let newGuests = guests.filter((guest, index) => (index !== props.id));
        setGuests(newGuests);
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <ul className="list-group mb-3">
                {guests.map((guest, index) => (
                    <GuestLine key={index} id={index} guest={guest} onDelete={deleteGuest} />
                ))}
            </ul>
            <GuestAdd addGuest={addGuest} />
            <SendButton updateList={updateList} />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h3 className="d-flex justify-content-between align-items-center mb-3">
            <span className="event-h">Guest List</span>
            <span className="badge badge-secondary badge-pill">{props.numGuests}</span>
        </h3>
    );
}

function GuestLine(props) {
    // Informational line for guests that have already been added.

    return (
        <li className="event-view-box list-group-item d-flex lh-condensed" >

            <input
                type="image"
                src="/images/Orange_x.svg.png"
                className="guest-delete-button guest-text"
                onClick={() => { props.onDelete(props); }} />

            <div className="guest-text guest-email">
                {props.guest.email}
            </div>

            <div className="guest-text guest-status" >
                {props.guest.sent === 0 && ('-')}
                {props.guest.sent === 1 && ('invited')}
            </div>

            <div className="guest-text guest-status" >
                {props.guest.status === 2 && (<span className="text-success">Yes</span>)}
                {props.guest.status === 1 && (<span className="text-warning">Maybe</span>)}
                {props.guest.status === 0 && (<span className="text-muted">No RSVP</span>)}
                {props.guest.status === -1 && (<span className="text-danger">No</span>)}
            </div>

        </li>
    );
}

function GuestAdd(props) {
    // Form for adding a new guest.
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    let xhrPost = new XMLHttpRequest();
    xhrPost.onload = postSuccess;

    function postSuccess() {
        console.log(this.responseText);
    }

    function SubmitGuest(event) {

        // Here, we pass this email string to the parent component.
        props.addGuest(email);

        xhrPost.open("POST", guestPostRoute);
        xhrPost.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
        xhrPost.send(email + "," + name);
        setEmail("");       // clear the input boxes. 
        setName("");
        event.preventDefault();
    }

    function handleNameChange(event) {
        setName(event.target.value);
    }

    function handleEmailChange(event) {
        let newEmail = event.target.value;      // pull out the "value" attribute. 
        setEmail(newEmail);
    }

    return (
        // for some reason, this is enctype="multipart/form-data".  Figure out why. 
        <form className="mb-2" onSubmit={SubmitGuest} >
            <input
                name="name"
                type="name"
                onChange={handleNameChange}
                value={name}
                placeholder="Guest name"
                className="event-edit-box event-edit-box-single" />
            <input
                name="email"
                type="email"
                onChange={handleEmailChange}
                value={email}
                placeholder="Guest email"
                className="guest-input event-edit-box event-edit-box-single" />
            <input className="btn btn-primary mt-2" type="submit" value="Add guest"></input>
        </form>
    );
}

function SendButton(props) {
    const [viewState, setViewState] = useState({ status: 0, message: "" });

    let xhrInvite = new XMLHttpRequest();
    xhrInvite.onload = () => {
        console.log(xhrInvite.responseText);
        setViewState({ status: xhrInvite.status, message: xhrInvite.responseText });
        props.updateList();
    }

    function sendInvites() {
        xhrInvite.open("GET", invitesRoute);
        xhrInvite.send();
        event.preventDefault();
    }
    return (
        <div className="row">
            <div className="col-8">
                <button onClick={sendInvites} className="btn btn-primary mt-3">Send invitations</button>
                <p className="event-p">to new guests only</p>
            </div>
            {(viewState.status === 200) && (<div className="alert alert-success col-6" role="alert">{viewState.message}</div>)}
            {(viewState.status === 204) && (<div className="alert alert-info  col-6" role="alert">No new invites</div>)}
            {(viewState.status >= 400) && (<div className="alert alert-warning col-6" role="alert">Error sending</div>)}
        </div>
    );
}



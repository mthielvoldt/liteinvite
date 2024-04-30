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

    function addGuest(newGuestName, newGuestEmail) {

        // new guest has no email and there's another guest also with the same name and no email. 
        const nameCollision = (newGuestEmail === "") && guests.some(
            (guest) => guest.name === newGuestName
        );

        // new guest has an email and this email has been entered before.
        const emailCollision = (newGuestEmail !== "") && guests.some(
            (guest) => guest.email.toUpperCase() === newGuestEmail.toUpperCase()
        );

        if (emailCollision || nameCollision) {
            console.log("guest matches one previously entered.");
        } else {
            setGuests([...guests, { name: newGuestName, email: newGuestEmail, status: 0, sent: 0 }]);
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
    const [tooltip, setTooltip] = useState("Copy guest's url to clipboard");
    let guestStatus;
    if (props.guest.sent === 0) { guestStatus = (<span className="text-muted">Not invited</span>) }
    else {
        switch (props.guest.status) {
            case 2:
                guestStatus = (<span className="text-success">Yes</span>);
                break;
            case 1:
                guestStatus = (<span className="text-warning">Maybe</span>);
                break;
            case -1:
                guestStatus = (<span className="text-danger">No</span>);
                break;
            default:
                guestStatus = (<span className="text-muted">No RSVP</span>);
        }
    }

    function copyURL(props) {
        const guestURL = "https://liteinvite.com/events/" + meetId + "?guest=" + props.guest._id;
        console.log("guests url: " + guestURL);
        navigator.clipboard.writeText(guestURL);
        setTooltip("URL Copied!")
    }
    function clearTooltip() {
        setTooltip("Copy guest's url to clipboard");
    }

    return (
        <li className="event-view-box list-group-item d-flex lh-condensed" >

            <input
                type="image"
                src="/images/Orange_x.svg.png"
                className="guest-delete-button guest-text"
                onClick={() => { props.onDelete(props); }} />
            <button onClick={() => copyURL(props)} onMouseOut={() => clearTooltip()} className="btn guest-copy-icon">
                <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 16 16" width="16" height="16" fill="white">
                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                </svg>
                <span id="copy-url-tooltip" data-direction="nw" aria-label="Copy url to clipboard" role="tooltip" className="copy-url-popover">
                    {tooltip}
                </span>
            </button>


            <div className="guest-text guest-name">
                {props.guest.name}
            </div>

            <div className="guest-text guest-status" >
                {guestStatus}
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
        const newGuest = {
            name: name,
            email: email,
        }

        // Here, we pass this email string to the parent component.
        props.addGuest(name, email);

        xhrPost.open("POST", guestPostRoute);
        xhrPost.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhrPost.send(JSON.stringify(newGuest));
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
                <button onClick={sendInvites} className="btn btn-primary mt-3">Send email invites</button>
                <p className="event-p">to new guests only</p>
            </div>
            {(viewState.status === 200) && (<div className="alert alert-success col-6" role="alert">{viewState.message}</div>)}
            {(viewState.status === 204) && (<div className="alert alert-info  col-6" role="alert">No new invites</div>)}
            {(viewState.status >= 400) && (<div className="alert alert-warning col-6" role="alert">Error sending</div>)}
        </div>
    );
}



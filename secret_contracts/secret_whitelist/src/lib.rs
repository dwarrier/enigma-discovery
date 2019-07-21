// Built-In Attributes
#![no_std]

// Imports
extern crate eng_wasm;
extern crate eng_wasm_derive;
extern crate serde;
extern crate uuid;

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use std::collections::HashMap;

// Encrypted state keys
// HashMap<eng_wasm::String,SecretInfo>
static ALL_SECRETS: &str = "all_secrets";
// HashMap<H256,Vec<eng_wasm::String>>
static SECRET_IDS_FOR_TESTATOR: &str = "secret_ids_by_testator";
// HashMap<H256,Vec<eng_wasm::String>>
static SECRET_IDS_BY_BENEFICIARY: &str = "secret_ids_by_beneficiary";

// Structs

#[derive(Serialize, Deserialize)]
pub struct SecretInfo {
    id: eng_wasm::String,
    name: eng_wasm::String,
    content: eng_wasm::String,
    whitelist: Vec<H256>,
    // We set the value to 0 or 1 since apparently
    // there's no Boolean type in eng_wasm.
    release_votes: HashMap<H256, U256>,
}

#[pub_interface]
pub trait ContractInterface {
    // Testator methods
    fn add_secret_for_testator(
        testator_addr: H256,
        secret_name: eng_wasm::String,
        secret_content: eng_wasm::String,
    );
    fn remove_secret_for_testator(testator_addr: H256, secret_id: eng_wasm::String);
    fn get_current_secret_ids_for_testator(testator_addr: H256) -> eng_wasm::Vec<eng_wasm::String>;
    /*
    fn add_addr_to_whitelist(testator_addr: H256, beneficiary_addr: H256);
    fn remove_addr_from_whitelist(testator_addr: H256, beneficiary_addr: H256);
    fn get_num_secrets_for_testator(testator_addr: H256) -> U256;
    fn get_testator_info_for_secret(testator_addr: H256, secret_index: U256) -> (eng_wasm::String, eng_wasm::String, Vec<H256>);
    */

    // Beneficiary methods
    /*
    fn get_num_secrets_for_beneficiary(beneficiary_addr: H256) -> U256;
    fn get_beneficiary_secret_id_by_index();
    fn get_beneficiary_info_for_secret(beneficiary_addr: H256, ) -> (eng_wasm::String);
    fn vote_to_release(beneficiary_addr: H256, vote: U256);
    fn can_release_secret(beneficiary_addr: H256, secret_id: eng_wasm::String);
    fn attempt_release_secret(beneficiary_addr: H256, secret_id: eng_wasm::String);
    */
}

pub struct Contract;

// Private functions accessible only by the secret contract
impl Contract {
    fn get_secret_ids_for_testator() -> HashMap<H256, eng_wasm::Vec<eng_wasm::String>> {
        read_state!(SECRET_IDS_FOR_TESTATOR).unwrap_or_default()
    }
    fn get_all_secrets() -> HashMap<eng_wasm::String, SecretInfo> {
        read_state!(ALL_SECRETS).unwrap_or_default()
    }
}

impl ContractInterface for Contract {
    #[no_mangle]
    fn add_secret_for_testator(
        testator_addr: H256,
        secret_name: eng_wasm::String,
        secret_content: eng_wasm::String,
    ) {
        let mut secret_ids_for_testator = Self::get_secret_ids_for_testator();
        let mut all_secrets = Self::get_all_secrets();

        let mut secret_ids = secret_ids_for_testator
            .entry(testator_addr)
            .or_insert_with(eng_wasm::Vec::new);

        // TODO: can't generate this UUID because the task runs into an error: Error in execution of WASM code: Instantiation: Module __wbindgen_placeholder__ not found
        //let secret_id = Uuid::new_v4().to_hyphenated().to_string();
        let secret_id = String::from("some_id");

        let new_secret = SecretInfo {
            id: secret_id.clone(),
            name: secret_name,
            content: secret_content,
            whitelist: eng_wasm::Vec::new(),
            release_votes: HashMap::new(),
        };

        secret_ids.push(secret_id.clone());

        all_secrets.insert(secret_id, new_secret);

        // TODO: can't write state for either of these without running into an error: Error in execution of smart contract function: Error in execution of WASM code: unreachable
        //
        //write_state!(ALL_SECRETS => all_secrets);

        //write_state!(SECRET_IDS_FOR_TESTATOR => secret_ids_for_testator);
        // TODO: update secret_ids_for_beneficiary
        // TODO: addresses may need to be H160
    }

    #[no_mangle]
    fn remove_secret_for_testator(testator_addr: H256, secret_id: eng_wasm::String) {
        let mut secret_ids_for_testator = Self::get_secret_ids_for_testator();
        let mut all_secrets = Self::get_all_secrets();

        let mut secret_ids = secret_ids_for_testator
            .entry(testator_addr)
            .or_insert_with(eng_wasm::Vec::new);

        secret_ids.retain(|e| !(*e == secret_id));
        all_secrets.remove(&secret_id);
    }

    #[no_mangle]
    fn get_current_secret_ids_for_testator(testator_addr: H256) -> eng_wasm::Vec<eng_wasm::String> {
        let mut secret_ids_for_testator = Self::get_secret_ids_for_testator();
        let secret_ids = secret_ids_for_testator
            .entry(testator_addr)
            .or_insert_with(eng_wasm::Vec::new);
        // TODO: not able to return this as is, and don't even know
        // if this is the right way to go about it
        secret_ids.clone()
    }
}

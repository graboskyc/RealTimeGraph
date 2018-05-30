from cloudshell.api.cloudshell_api import CloudShellAPISession, AttributeNameValue
import os
import json
from os import environ as parameter
import socket
import base64
import requests
import json
import os
from cloudshell.api.common_cloudshell_api import CommonAPISession, CommonResponseInfo, CommonAPIRequest

class QualiAPISession():
	def __init__(self, host, username='', password='', domain='Global', timezone='UTC', datetimeformat='MM/dd/yyyy HH:mm', token_id='', port=9000):
		self._api_base_url = "http://{0}:{1}/Api".format(host, port)
		if token_id:
			login_result = requests.put(self._api_base_url + "/Auth/Login", {"token": token_id, "domain": domain})
		elif username and password:
			login_result = requests.put(self._api_base_url + "/Auth/Login", {"username": username, "password": password, "domain": domain})
		else:
			raise ValueError("Must supply either username and password or token_id")
		self._auth_code = "Basic {0}".format(login_result.content[1:-1])

	def GetReservationAttachment(self, sandbox_id, filename, save_path):
		"""
			Download an attached file from a Sandbox. The downloaded file will be saved at {save_path}\filename
			:param sandbox_id: ID of the reservation containing the file 
			:param filename: File to get from the reservation
			:param target_filename: target file name to save the file as
		"""
		get_result = requests.post(self._api_base_url + "/Package/GetReservationAttachment", {"ReservationId":sandbox_id, "FileName": filename}, headers={"Authorization": self._auth_code})
		if 200 <= get_result.status_code < 300:
			if save_path.endswith(os.path.sep):
				with open(r"{0}{1}".format(save_path, "STAT_FILE.txt"), "wb") as target_file:
					target_file.write(get_result.content)

			else:
				with open(r"{0}{1}{2}".format(save_path, os.path.sep, "STAT_FILE.txt"), "wb") as target_file:
					target_file.write(get_result.content)
		else:
			raise ValueError(get_result.content)

	def GetReservationAttachmentsDetails(self, sandbox_id):
		"""
			Get the list of files currently attached to a Sandbox
			:param sandbox_id: 
			:return: List of files attached to the Sandbox
			:rtype: list[str]			
		"""
		get_result = requests.get(self._api_base_url + "/Package/GetReservationAttachmentsDetails/{0}".format(sandbox_id), headers={"Authorization": self._auth_code})
		if 200 <= get_result.status_code < 300:
			result_json = json.loads(get_result.content)
			if result_json["Success"]:
				return result_json["AllAttachments"]
			else:
				raise ValueError(result_json["ErrorMessage"])
		else:
			raise ValueError(get_result.content)


	def DeleteFileFromReservation(self, sandbox_id, filename):
		"""
			Delete an attached file from a Sandbox 
			:param sandbox_id: The ID of the Sandbox to delete the file from
			:param filename: the exact name of the file to delete
		"""
		delete_result = requests.post(self._api_base_url + "/Package/DeleteFileFromReservation", data={"reservationId": sandbox_id, "FileName": filename}, headers={"Authorization": self._auth_code})

	def AttachFileToReservation(self, sandbox_id, filename, target_filename, overwrite_if_exists):
		"""
			Attach a file to a Sandbox
			:param filename: The full path of the file to attach
			:param target_filename: The name the file will be saved under in the Sandbox
			:param overwrite_if_exists: if True, the file will overwrite an existing file of the same name if such a file exists
			:return: 
		"""
		overwrite_str = "True" if overwrite_if_exists else "False"
		with open(filename, "rb") as attached_file:
			attach_file_result = requests.post(self._api_base_url + "/Package/AttachFileToReservation", headers={"Authorization": self._auth_code},
										   data={"reservationId": sandbox_id, "saveFileAs": target_filename, "overwriteIfExists": overwrite_if_exists},
										   files={'QualiPackage': attached_file})


####################################
# main
####################################

# parse script inputs
reservationContext = json.loads(parameter["reservationContext"])
connectivityContext = json.loads(parameter["qualiConnectivityContext"])

# get res ID
resID = reservationContext["id"]

# conenct to both APIs needed
quali_api = QualiAPISession(host=connectivityContext["serverAddress"], domain='Global', username='admin', password='admin', port=9000)
api = CloudShellAPISession(host=connectivityContext["serverAddress"], token_id=connectivityContext["adminAuthToken"], domain=reservationContext["domain"])

# get list of attachments to current reservation
attList = quali_api.GetReservationAttachmentsDetails(resID)

# variables for file manipulation
targetDir = "C:\\inetpub\\wwwroot\\Data\\" + resID
targetFile = targetDir + "\\STAT_FILE.txt"

# iterate thru each attachment
for att in attList:
	# we only care about the Ixia CSV file
	if (att.endswith(".csv")):
		# make the directory for this res ID
		# if stat file exists there, delete it first
		if not os.path.exists(targetDir):
			os.makedirs(targetDir)

	quali_api.GetReservationAttachment(resID, att, targetDir)
	#os.rename(targetDir+"\\"+att, targetFile)
	api.WriteMessageToReservationOutput(resID, "Graph is ready. <a href='http://192.168.41.79:8888/Graph.html?RES="+resID+"' target='_blank'>Click here to view</a>.")
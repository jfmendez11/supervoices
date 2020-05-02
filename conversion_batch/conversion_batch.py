# -*- coding: utf-8 -*-
import os
import pymongo
from bson.objectid import ObjectId
import sys
import boto3
import time
import requests
import dotenv
import traceback
from shutil import copyfile
import sendgrid

from pydub import AudioSegment


def get_audio_file_for_conversion(url):
    '''
    Method that requests the audio file from the file server
    '''
    response = requests.get(url)
    print 'FILE OBTAINED FROM SERVER'
    # sys.stdout.flush()
    return response.content


def convert_audio(path):
    '''
    Method that converts any audio format into mp3
    '''
    if not path.endswith(".mp3"):
        # File extension is obtained
        split = path.split(".")
        extension = split[len(split) - 1]

        # The file path is split to obtain the file name
        path_split = path.split("/")
        file_name = path_split[len(path_split) - 1]
        file_name = file_name.replace(extension, "mp3")

        # Audio load and export to mp3
        audio = AudioSegment.from_file(path, format=extension)
        export_file_name = "./temp/converted_" + file_name
        audio.export(export_file_name)
        print 'FILE CONVERTED AND EXPORTED'

        return export_file_name
    else:
        path_split = path.split("/")
        file_name = path_split[len(path_split) - 1]
        source_path = "./temp/" + file_name
        export_file_name = "./temp/converted_" + file_name
        copyfile(source_path, export_file_name)
        return export_file_name


def post_converted(path, base_url, entry):
    '''
    Method that posts the converted file to the file server
    '''
    # Upload entry converted to S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv("ACCESS_KEY"),
        aws_secret_access_key=os.getenv("SECRET_KEY"),
        region_name=os.getenv('AWS_REGION')
    )
    base_url = base_url.split('/')
    del base_url[len(base_url) - 1]
    del base_url[0]
    del base_url[0]
    del base_url[0]
    base_url = '/'.join(base_url)
    file_name = path.split('/')
    file_name = file_name[len(file_name) - 1]
    base_url = base_url + '/' + file_name

    s3.upload_file(path, os.getenv('S3_BUCKET_NAME'), base_url, ExtraArgs={'ACL': 'public-read'})

    # Update Mongo
    myclient = pymongo.MongoClient(os.getenv('MLAB_URI'))
    mydb = myclient[os.getenv("MLAB_DATABASE")]
    mycol = mydb["entries"]

    myquery = {"_id": ObjectId(entry['entry_id'])}
    newvalues = {"$set": {
        "STATUS": "Convertida",
        "URL_CONVERTED": os.getenv('CLOUDFRONT_DOMAIN_NAME') + '/' + base_url
    }}

    mycol.update_one(myquery, newvalues)

    print 'FILE SUBMITTED: ' + entry['url_original']


def process_entry(entry):
    '''
    Method that processes an audio entry
    '''
    correct = True
    # Request audio file from server
    try:
        if entry['url_original'] != '':
            print 'PROCESSING: ' + entry['url_original']
            url_original = entry['url_original']
            audio_file = get_audio_file_for_conversion(url_original)
            file_name = url_original.split('/')
            file_name = file_name[len(file_name) - 1]

            # Audio saving in temporal directory
            local_path = './temp/' + file_name
            temp = open(local_path, "wb")
            temp.write(audio_file)
            temp.close()

            # Audio conversion
            path_converted = convert_audio(local_path)
            post_converted(path_converted, url_original, entry)
            try:
                os.remove(path_converted)
                os.remove(local_path)
            except Exception:
                print "CANNOT REMOVE FILE"
            entry_data = get_mail(entry)
            entry['name'] = entry_data['NAME']
            entry['email'] = entry_data['EMAIL']
            entry['url_contest'] = os.getenv('WS_URL') + entry['contest_id']
            print("READY TO SEND EMAIL")
            send_mail(entry)

            print 'FILE REMOVED: ' + entry['url_original']
            # sys.stdout.flush()

    except Exception as e:
        print 'AN ERROR HAS OCCURRED'
        print traceback.print_exc()
        correct = False
    finally:
        print('---------------------')
        # end = time.time()
        # start = entry["created_at"]
        # duration = end - float(start) / 1000
        # with open("log.txt", "a") as myfile:
        #    myfile.write(entry['url_original'] + " " + str(duration) + "\n")
    return correct


def execute_batch():
    '''
    Method that executes the batch conversion task
    '''

    # Create SQS client
    sqs = boto3.client(
        'sqs',
        aws_access_key_id=os.getenv("ACCESS_KEY"),
        aws_secret_access_key=os.getenv("SECRET_KEY"),
        region_name=os.getenv('AWS_REGION')
    )
    queue_url = os.getenv('SQS_URL')
    entries = []

    # Receive message from SQS queue
    response = sqs.receive_message(
        QueueUrl=queue_url,
        AttributeNames=[
            'EntryId',
            'ContestId',
            'RecordingPath'
        ],
        MaxNumberOfMessages=2,
        MessageAttributeNames=[
            'All'
        ]
    )

    if 'Messages' in response:

        messages = response['Messages']

        for message in messages:
            receipt_handle = message['ReceiptHandle']

            # Delete received message from queue
            entries.append({
                'url_original': message['MessageAttributes']['RecordingPath']['StringValue'],
                'entry_id': message['MessageAttributes']['EntryId']['StringValue'],
                'contest_id': message['MessageAttributes']['ContestId']['StringValue'],
                'receipt_handle': receipt_handle
            })
        for en in entries:
            correct = process_entry(en)
            if correct:
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=en['receipt_handle']
                )


def get_mail(entry):
    myclient = pymongo.MongoClient(os.getenv('MLAB_URI'))
    mydb = myclient[os.getenv("MLAB_DATABASE")]
    mycol = mydb["entries"]
    myquery = {"_id": ObjectId(entry['entry_id'])}
    mydoc = mycol.find_one(myquery)

    return mydoc


def send_mail(entry):
    sender_email = os.getenv('SENDER_EMAIL')
    receiver_email = entry['email']
    receiver_name = entry['name']

    sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
    subject = "Tu entrada ha sido agregada al concurso!"
    from_email = sender_email
    to_email = receiver_email

    text = """\
                    Gracias por usar SuperVoices
                    {name}, tu voz ya se encuentra disponible en el concurso!
                    La entrada ya fue cargada a la página del concurso donde podra ser revisada por el organizador.
                    Visita el concurso: https://supervoices10.herokuapp.com/#/contests/{contestURL}
                    """.format(contestURL=entry['url_contest'], name=receiver_name)
    html = """\
                    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    	<meta http-equiv="content-type" content="text/html; charset=utf-8">
      	<meta name="viewport" content="width=device-width, initial-scale=1.0;">
     	<meta name="format-detection" content="telephone=no"/>
    	<style>
    /* Reset styles */ 
    body {{ margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important;}}
    body, table, td, div, p, a {{ -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }}
    img {{ border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }}
    #outlook a {{ padding: 0; }}
    .ReadMsgBody {{ width: 100%; }} .ExternalClass {{ width: 100%; }}
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {{ line-height: 100%; }}
    /* Rounded corners for advanced mail clients only */ 
    @media all and (min-width: 560px) {{
    	.container {{ border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; -khtml-border-radius: 8px;}}
    }}
    /* Set color for auto links (addresses, dates, etc.) */ 
    a, a:hover {{
    	color: #127DB3;
    }}
    .footer a, .footer a:hover {{
    	color: #999999;
    }}
     	</style>
    	<!-- MESSAGE SUBJECT -->
    	<title>SuperVoices</title>
    </head>
    <p>{prevText}</p>
    <!-- BODY -->
    <body topmargin="0" rightmargin="0" bottommargin="0" leftmargin="0" marginwidth="0" marginheight="0" width="100%" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%; height: 100%; -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%;
    	background-color: #F0F0F0;
    	color: #000000;"
    	bgcolor="#F0F0F0"
    	text="#000000">
    <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; margin-top: 5%; padding: 0; width: 100%;" class="background"><tr><td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;"
    	bgcolor="#F0F0F0">
    <table border="0" cellpadding="0" cellspacing="0" align="center"
    	width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
    	max-width: 560px;" class="wrapper">
    <!-- End of WRAPPER -->
    </table>
    <!-- WRAPPER / CONTEINER -->
    <table border="0" cellpadding="0" cellspacing="0" align="center"
    	bgcolor="#FFFFFF"
    	width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
    	max-width: 560px;" class="container">
    	<!-- HEADER -->
    	<tr>
    		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 24px; font-weight: bold; line-height: 130%;
    			padding-top: 25px;
    			color: #000000;
    			font-family: sans-serif;" class="header">
    				Gracias por usar SuperVoices
    		</td>
    	</tr>
    	<!-- SUBHEADER -->
    	<tr>
    		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-bottom: 3px; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 18px; font-weight: 300; line-height: 150%;
    			padding-top: 5px;
    			color: #000000;
    			font-family: sans-serif;" class="subheader">
    				{name}, tu voz ya se encuentra disponible en el concurso!
    		</td>
    	</tr>
    	<!-- PARAGRAPH -->
    	<tr>
    		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
    			padding-top: 25px; 
    			color: #000000;
    			font-family: sans-serif;" class="paragraph">
    				La entrada ya fue cargada a la pagina del concurso donde podra ser revisada por el organizador.
    		</td>
    	</tr>
    	<tr>
    		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;
    			padding-top: 25px;" class="line"><hr
    			color="#E0E0E0" align="center" width="100%" size="1" noshade style="margin: 0; padding: 0;" />
    		</td>
    	</tr>
    	<tr>
    		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
    			padding-top: 20px;
    			padding-bottom: 25px;
    			color: #000000;
    			font-family: sans-serif;" class="paragraph">
    				Visita el concurso: <a href="{contestURL}" target="_blank" style="color: #127DB3; font-family: sans-serif; font-size: 17px; font-weight: 400; line-height: 160%;">supervoices.com</a>
    		</td>
    	</tr>
    <!-- End of WRAPPER -->
    </table>
    <!-- End of SECTION / BACKGROUND -->
    </td></tr></table>
    </body>
    </html>
                    """.format(prevText=text, contestURL=entry['url_contest'], name=receiver_name)

    message = {
        'personalizations': [
            {
                'to': [
                    {
                        'email': to_email
                    }
                ],
                'subject': subject
            }
        ],
        'from': {
            'email': from_email
        },
        'content': [
            {
                'type': 'text/html',
                'value': html
            }
        ]
    }

    # Send email
    response = sg.send(message)

    print(response.status_code)
    print(response.body)
    print(response.headers)


if __name__ == "__main__":
    dotenv.load_dotenv(".env")
    while True:
        sys.stdout.flush()
        execute_batch()
        time.sleep(5)
